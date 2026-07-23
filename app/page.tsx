"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CategoryChart from '@/components/CategoryChart';
import { createBrowserClient } from '@supabase/ssr';

export default function Dashboard() {
  const [data, setData] = useState({ totalSaldo: 0, inCycle: 0, outCycle: 0, catTotals: {} as Record<string, number> });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [greeting, setGreeting] = useState('BOSS');
  const [cycleInfo, setCycleInfo] = useState('');
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 11 ? 'PAGI' : hour < 15 ? 'SIANG' : hour < 18 ? 'SORE' : 'MALAM');

    const fetchDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('cycle_date').eq('id', user?.id).maybeSingle();
      const cycleDate = profile?.cycle_date || 1; 

      const now = new Date();
      let start = new Date(now.getFullYear(), now.getMonth(), cycleDate);
      let end = new Date(now.getFullYear(), now.getMonth() + 1, cycleDate - 1);
      
      if (now.getDate() < cycleDate) { 
        start = new Date(now.getFullYear(), now.getMonth() - 1, cycleDate);
        end = new Date(now.getFullYear(), now.getMonth(), cycleDate - 1);
      }
      
      const strStart = start.toISOString().split('T')[0];
      const strEnd = end.toISOString().split('T')[0];
      setCycleInfo(`${strStart} s/d ${strEnd}`);

      const { data: trx } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (trx) {
        let tSaldo = 0, inCyc = 0, outCyc = 0;
        const cTotal: Record<string, number> = {};
        
        trx.forEach(t => {
          const amt = Number(t.amount) || 0;
          if (t.type === 'pemasukan') tSaldo += amt; else tSaldo -= amt;

          if (t.date >= strStart && t.date <= strEnd) {
            if (t.type === 'pemasukan') inCyc += amt;
            else { 
              outCyc += amt; 
              const catKey = (t.category || '').toLowerCase();
              cTotal[catKey] = (cTotal[catKey] || 0) + amt; 
            }
          }
        });
        setData({ totalSaldo: tSaldo, inCycle: inCyc, outCycle: outCyc, catTotals: cTotal });
        setRecent(trx.slice(0, 5));
      }

      // Ambil Kasbon & Pastikan Angka Aman (Mencegah NaN)
      const { data: dData } = await supabase.from('debts').select('*').eq('status', 'belum_lunas');
      if (dData) {
        const sanitizedDebts = dData.map(d => ({
          ...d,
          amount: Number(d.amount) || 0,
          paid_amount: Number(d.paid_amount) || 0
        }));
        setDebts(sanitizedDebts);
      }

      // Load Target Anggaran dari LocalStorage
      const savedBudgets = localStorage.getItem('retrofin_budgets');
      if (savedBudgets) {
        try {
          setBudgets(JSON.parse(savedBudgets));
        } catch (e) {
          setBudgets([]);
        }
      } else {
        const defaultBudgets = [
          { category: 'Makan', target: 3000000 },
          { category: 'Bensin', target: 1000000 }
        ];
        setBudgets(defaultBudgets);
        localStorage.setItem('retrofin_budgets', JSON.stringify(defaultBudgets));
      }
    };
    fetchDashboard();
  }, [supabase]);

  return (
    <div className="min-h-screen p-6 md:p-12 text-black dark:text-white">
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-black">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest">SELAMAT {greeting}, BOSS!</h1>
          <p className="font-bold text-gray-500">Siklus Keuangan: {cycleInfo}</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Link href="/transaksi" className="retro-btn bg-yellow-300 px-4 py-2 font-bold uppercase border-4 border-black text-black">Input Data</Link>
          <Link href="/profil" className="retro-btn bg-gray-300 px-4 py-2 font-bold uppercase border-4 border-black text-black">Profil</Link>
        </div>
      </header>

      {/* Ringkasan Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-cyan-300 dark:bg-cyan-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl uppercase font-bold mb-2">Total Saldo Aktif</h2>
          <p className="text-3xl font-bold">Rp {data.totalSaldo.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-green-400 dark:bg-green-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl uppercase font-bold mb-2">Pemasukan (Siklus)</h2>
          <p className="text-3xl font-bold">Rp {data.inCycle.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-pink-400 dark:bg-pink-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl uppercase font-bold mb-2">Pengeluaran (Siklus)</h2>
          <p className="text-3xl font-bold">Rp {data.outCycle.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* PROGRESS BAR KASBON INTERAKTIF (Bebas NaN) */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-bold uppercase border-b-4 border-black pb-2 mb-4">PROGRESS KASBON</h2>
          {debts.length === 0 ? <p className="font-bold text-green-500 uppercase">BERSIH DARI UTANG! [OK]</p> : debts.map(d => {
            const totalAmount = Number(d.amount) || 0;
            const paidAmount = Number(d.paid_amount) || 0;
            const percent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
            const sisa = Math.max(0, totalAmount - paidAmount);
            
            return (
              <div key={d.id} className="mb-4">
                <div className="flex justify-between font-bold text-sm mb-1 uppercase">
                  <span>{d.type}: {d.person_name}</span>
                  <span>Sisa Rp {sisa.toLocaleString('id-ID')} ({percent}% LUNAS)</span>
                </div>
                <div className="w-full h-6 border-4 border-black bg-gray-200 dark:bg-gray-800">
                  <div className="h-full bg-blue-500 transition-all border-r-4 border-black" style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* TARGET ANGGARAN */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4">
            <h2 className="text-2xl font-bold uppercase">TARGET ANGGARAN</h2>
            <Link href="/profil" className="text-xs bg-blue-300 text-black border-2 border-black px-2 py-1 font-bold uppercase retro-btn">Kelola di Profil</Link>
          </div>
          {budgets.length === 0 ? (
            <p className="font-bold text-gray-500 uppercase">Belum ada target anggaran.</p>
          ) : (
            budgets.map((b, idx) => {
              const currentTotal = data.catTotals[(b.category || '').toLowerCase()] || 0;
              const targetVal = Number(b.target) || 1;
              const percent = Math.min(100, Math.round((currentTotal / targetVal) * 100));

              return (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between mb-1 font-bold text-sm uppercase">
                    <span>{b.category}</span>
                    <span>Rp {currentTotal.toLocaleString('id-ID')} / Rp {targetVal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full h-5 border-4 border-black bg-gray-200 dark:bg-gray-800">
                    <div className={`h-full border-r-4 border-black transition-all ${percent >= 100 ? 'bg-red-500' : 'bg-yellow-400'}`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AKTIVITAS TERKINI */}
      <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
        <h2 className="text-2xl font-bold uppercase border-b-4 border-black pb-2 mb-4">AKTIVITAS TERKINI</h2>
        <table className="w-full text-left border-collapse">
          <tbody>
            {recent.map(t => (
              <tr key={t.id} className="border-b-2 border-dashed border-black">
                <td className="py-2 font-bold">{t.date}</td>
                <td className="py-2 font-bold">{t.category}</td>
                <td className={`py-2 text-right font-bold ${t.type === 'pemasukan' ? 'text-green-500' : 'text-red-500'}`}>
                  {t.type === 'pemasukan' ? '+' : '-'}Rp {Number(t.amount || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link href="/histori" className="block text-center w-full mt-4 bg-gray-200 dark:bg-gray-800 border-4 border-black py-2 font-bold uppercase retro-btn cursor-pointer">
          Tabel Histori Lengkap
        </Link>
      </div>
      
      <CategoryChart />
    </div>
  );
}