// app/api/cron/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Gunakan SERVICE_ROLE_KEY untuk bypass RLS (Row Level Security) karena ini dijalankan oleh Cron/Sistem
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET(request: Request) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Cari semua transaksi berulang yang jadwal eksekusinya HARI INI atau SEBELUMNYA
    const { data: rules, error: fetchError } = await supabase
      .from('recurring_rules')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_date', today);

    if (fetchError) throw fetchError;
    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: 'TIDAK ADA TRANSAKSI JATUH TEMPO HARI INI. [OK]' });
    }

    for (const rule of rules) {
      // 2. Insert ke tabel transaksi utama
      await supabase.from('transactions').insert([{
        type: rule.type,
        category: rule.category,
        amount: rule.amount,
        notes: `[OTOMATIS] ${rule.notes}`,
        date: today,
      }]);

      // 3. Hitung tanggal eksekusi berikutnya (tambah interval_days)
      const nextRun = new Date(today);
      nextRun.setDate(nextRun.getDate() + rule.interval_days);
      const nextRunString = nextRun.toISOString().split('T')[0];

      // 4. Update tabel aturan dengan tanggal baru
      await supabase
        .from('recurring_rules')
        .update({ next_run_date: nextRunString })
        .eq('id', rule.id);
    }

    return NextResponse.json({ message: `SUKSES! ${rules.length} TRANSAKSI OTOMATIS DIEKSEKUSI.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}