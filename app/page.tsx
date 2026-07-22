"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CategoryChart from '@/components/CategoryChart';
import { createBrowserClient } from '@supabase/ssr';

export default function Dashboard() {
  const [data, setData] = useState({
    totalSaldo: 0,
    pemasukanBulanIni: 0,
    pengeluaranBulanIni: 0,
    pemasukanBulanLalu: 0,
    pengeluaranBulanLalu: 0,
    recentTransactions: [] as any[],
    categoryTotals: {} as Record<string, number>
  });
  
  const [budgets, setBudgets] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      const now = new Date();

      // Tanggal Rentang Bulan Ini
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Tanggal Rentang Bulan Lalu
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      // 1. Fetch Transaksi & Kalkulasi Dinamis
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactions) {
        let totalSaldo = 0;
        let pemasukanBulanIni = 0;
        let pengeluaranBulanIni = 0;
        let pemasukanBulanLalu = 0;
        let pengeluaranBulanLalu = 0;
        const categoryTotals: Record<string, number> = {};

        transactions.forEach((trx) => {
          const amount = Number(trx.amount) || 0;

          if (trx.type === 'pemasukan') {
            totalSaldo += amount;
            
            // Cek jika transaksi terjadi di Bulan Ini
            if (trx.date >= startOfMonth && trx.date <= endOfMonth) {
              pemasukanBulanIni += amount;
            }
            // Cek jika transaksi terjadi di Bulan Lalu
            if (trx.date >= startOfLastMonth && trx.date <= endOfLastMonth) {
              pemasukanBulanLalu += amount;
            }

          } else if (trx.type === 'pengeluaran') {
            totalSaldo -= amount;

            // Cek jika transaksi terjadi di Bulan Ini
            if (trx.date >= startOfMonth && trx.date <= endOfMonth) {
              pengeluaranBulanIni += amount;
              const cat = trx.category || 'Lainnya';
              categoryTotals[cat.toLowerCase()] = (categoryTotals[cat.toLowerCase()] || 0) + amount;
            }
            // Cek jika transaksi terjadi di Bulan Lalu
            if (trx.date >= startOfLastMonth && trx.date <= endOfLastMonth) {
              pengeluaranBulanLalu += amount;
            }
          }
        });

        setData({
          totalSaldo,
          pemasukanBulanIni,
          pengeluaranBulanIni,
          pemasukanBulanLalu,
          pengeluaranBulanLalu,
          recentTransactions: transactions.slice(0, 5),
          categoryTotals
        });
      }

      // 2. Fetch Kasbon yang Belum Lunas
      const { data: debtsData } = await supabase.from('debts').select('*').eq('status', 'belum_lunas');
      if (debtsData) setDebts(debtsData);

      // 3. Load Target Anggaran dari LocalStorage
      const savedBudgets = localStorage.getItem('retrofin_budgets');
      if (savedBudgets) setBudgets(JSON.parse(savedBudgets));

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [supabase]);

  // Fungsi Pembantu Kalkulasi MoM (% Perubahan)
  const getMoMStats = (current: number, previous: number) => {
    if (previous === 0) {
      return { percent: current > 0 ? 100 : 0, isUp: current > 0, diff: current };
    }
    const diff = current - previous;
    const percent = Math.round((diff / previous) * 100);
    return {
      percent: Math.abs(percent),
      isUp: diff >= 0,
      diff
    };
  };

  const pengeluaranMoM = getMoMStats(data.pengeluaranBulanIni, data.pengeluaranBulanLalu);
  const pemasukanMoM = getMoMStats(data.pemasukanBulanIni, data.pemasukanBulanLalu);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center font-bold text-2xl uppercase dark:text-white">
        MEMUAT DASHBOARD RETROFIN...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 text-black dark:text-white">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 border-4 border-black bg-white dark:bg-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#4dff4d] gap-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest">RetroFin 98</h1>
        <div className="flex gap-3">
          <Link href="/transaksi" className="retro-btn bg-yellow-300 dark:bg-purple-600 text-black dark:text-white border-4 border-black px-4 py-2 font-bold uppercase">+ Transaksi</Link>
          <Link href="/histori" className="retro-btn bg-blue-300 dark:bg-blue-800 text-black dark:text-white border-4 border-black px-4 py-2 font-bold uppercase">Histori</Link>
          <Link href="/profil" className="retro-btn bg-gray-300 dark:bg-gray-700 text-black dark:text-white border-4 border-black px-4 py-2 font-bold uppercase">Profil / Setting</Link>
        </div>
      </header>

      {/* Cards Ringkasan Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-cyan-300 dark:bg-cyan-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <h2 className="text-xl uppercase font-bold mb-2">Total Saldo</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.totalSaldo.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-green-400 dark:bg-green-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <h2 className="text-xl uppercase font-bold mb-2">Pemasukan Bulan Ini</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.pemasukanBulanIni.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-pink-400 dark:bg-pink-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <h2 className="text-xl uppercase font-bold mb-2">Pengeluaran Bulan Ini</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.pengeluaranBulanIni.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Ringkasan Target Anggaran */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4">
            <h2 className="text-2xl font-bold uppercase">Target Anggaran</h2>
            <Link href="/profil" className="text-xs bg-blue-300 text-black border-2 border-black px-2 py-1 font-bold uppercase retro-btn hover:bg-blue-400">
              Kelola di Profil
            </Link>
          </div>

          {budgets.length === 0 ? (
            <p className="font-bold text-center py-6 text-gray-500">BELUM ADA TARGET. SILAKAN BUAT DI PROFIL.</p>
          ) : (
            budgets.map((b, idx) => {
              const currentTotal = data.categoryTotals[b.category.toLowerCase()] || 0;
              const percent = Math.min(100, Math.round((currentTotal / b.target) * 100));

              return (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between mb-1 font-bold text-sm">
                    <span className="uppercase">{b.category}</span>
                    <span>Rp {currentTotal.toLocaleString('id-ID')} / Rp {b.target.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full h-5 border-4 border-black bg-gray-200 dark:bg-gray-800">
                    <div 
                      className={`h-full border-r-4 border-black transition-all ${percent >= 100 ? 'bg-red-500' : 'bg-yellow-400 dark:bg-yellow-500'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Ringkasan Kasbon Belum Lunas */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4">
            <h2 className="text-2xl font-bold uppercase">Kasbon Belum Lunas</h2>
            <Link href="/profil" className="text-xs bg-blue-300 text-black border-2 border-black px-2 py-1 font-bold uppercase retro-btn hover:bg-blue-400">
              Kelola di Profil
            </Link>
          </div>

          {debts.length === 0 ? (
            <p className="font-bold text-center py-6 text-green-500">SEMUA KASBON SUDAH LUNAS [OK]</p>
          ) : (
            <div className="flex flex-col gap-3">
              {debts.map((d) => (
                <div key={d.id} className="border-2 border-black p-3 flex justify-between items-center bg-gray-100 dark:bg-gray-900">
                  <div>
                    <span className={`font-bold text-xs px-2 py-1 border-2 border-black uppercase mr-2 ${d.type === 'utang' ? 'bg-red-400 text-black' : 'bg-green-400 text-black'}`}>{d.type}</span>
                    <span className="font-bold uppercase">{d.person_name}</span>
                  </div>
                  <span className="font-bold">Rp {d.amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* SECTION KARTU MONTH OVER MONTH (MoM) */}
      {/* ========================================== */}
      <div className="bg-yellow-100 dark:bg-yellow-950 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] mb-10">
        <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4">
          <h2 className="text-2xl font-bold uppercase">ANALISIS MONTH-OVER-MONTH (MoM)</h2>
          <span className="text-xs bg-black text-white dark:bg-white dark:text-black px-2 py-1 font-bold uppercase">VS BULAN LALU</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MoM Pengeluaran */}
          <div className="bg-white dark:bg-black border-4 border-black p-4">
            <p className="font-bold text-sm uppercase text-gray-600 dark:text-gray-400 mb-1">Pengeluaran dibanding Bulan Lalu</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold">Rp {data.pengeluaranBulanIni.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500 font-bold">Bulan Lalu: Rp {data.pengeluaranBulanLalu.toLocaleString('id-ID')}</p>
              </div>
              <span className={`px-3 py-1 font-bold border-2 border-black text-sm uppercase ${
                pengeluaranMoM.isUp ? 'bg-red-400 text-black' : 'bg-green-400 text-black'
              }`}>
                {pengeluaranMoM.isUp ? `+${pengeluaranMoM.percent}% (BOROS)` : `-${pengeluaranMoM.percent}% (HEMAT)`}
              </span>
            </div>
          </div>

          {/* MoM Pemasukan */}
          <div className="bg-white dark:bg-black border-4 border-black p-4">
            <p className="font-bold text-sm uppercase text-gray-600 dark:text-gray-400 mb-1">Pemasukan dibanding Bulan Lalu</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold">Rp {data.pemasukanBulanIni.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500 font-bold">Bulan Lalu: Rp {data.pemasukanBulanLalu.toLocaleString('id-ID')}</p>
              </div>
              <span className={`px-3 py-1 font-bold border-2 border-black text-sm uppercase ${
                pemasukanMoM.isUp ? 'bg-green-400 text-black' : 'bg-red-400 text-black'
              }`}>
                {pemasukanMoM.isUp ? `+${pemasukanMoM.percent}% (NAIK)` : `-${pemasukanMoM.percent}% (TURUN)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grafik */}
      <CategoryChart />

    </div>
  );
}