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
    recentTransactions: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactions && !error) {
        let totalSaldo = 0;
        let pemasukanBulanIni = 0;
        let pengeluaranBulanIni = 0;

        transactions.forEach((trx) => {
          const amount = Number(trx.amount) || 0;
          if (trx.type === 'pemasukan') {
            totalSaldo += amount;
            if (trx.date >= startOfMonth && trx.date <= endOfMonth) {
              pemasukanBulanIni += amount;
            }
          } else if (trx.type === 'pengeluaran') {
            totalSaldo -= amount;
            if (trx.date >= startOfMonth && trx.date <= endOfMonth) {
              pengeluaranBulanIni += amount;
            }
          }
        });

        setData({
          totalSaldo,
          pemasukanBulanIni,
          pengeluaranBulanIni,
          recentTransactions: transactions.slice(0, 5)
        });
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 md:p-12 flex items-center justify-center font-bold text-2xl uppercase dark:text-white">
        MEMUAT DATA DASHBOARD...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 border-4 border-black bg-white dark:bg-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#4dff4d]">
        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-black dark:text-white">
          RetroFin 98
        </h1>
        <div className="flex gap-2 md:gap-4">
          <Link 
            href="/transaksi" 
            className="retro-btn bg-yellow-300 dark:bg-purple-600 text-black dark:text-white border-4 border-black p-2 font-bold text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
          >
            + Transaksi
          </Link>
          <Link 
            href="/profil" 
            className="retro-btn bg-gray-300 dark:bg-gray-700 text-black dark:text-white border-4 border-black p-2 font-bold text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
          >
            Profil
          </Link>
        </div>
      </header>

      {/* Ringkasan Saldo Dinamis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-cyan-300 dark:bg-cyan-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] text-black dark:text-white">
          <h2 className="text-xl uppercase mb-2 font-bold">Total Saldo</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.totalSaldo.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-green-400 dark:bg-green-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] text-black dark:text-white">
          <h2 className="text-xl uppercase mb-2 font-bold">Pemasukan Bulan Ini</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.pemasukanBulanIni.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-pink-400 dark:bg-pink-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] text-black dark:text-white">
          <h2 className="text-xl uppercase mb-2 font-bold">Pengeluaran Bulan Ini</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.pengeluaranBulanIni.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Aktivitas Terkini (Data Asli dari Supabase) */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4">
            <h2 className="text-2xl font-bold uppercase text-black dark:text-white">Aktivitas Terkini</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black border-dashed text-black dark:text-white">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((trx) => (
                    <tr key={trx.id} className="border-b-2 border-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">
                      <td className="py-3 font-bold">{trx.date}</td>
                      <td>{trx.category}</td>
                      <td className={`text-right font-bold ${trx.type === 'pemasukan' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {trx.type === 'pemasukan' ? '+' : '-'}Rp {Number(trx.amount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center font-bold uppercase text-black dark:text-white">
                      BELUM ADA TRANSAKSI TERCATAT.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Link href="/histori" className="block text-center w-full mt-6 retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black p-2 font-bold uppercase hover:bg-gray-800 transition-colors">
            Lihat Semua Histori
          </Link>
        </div>

        {/* Grafik Pengeluaran */}
        <div>
          <CategoryChart />
        </div>
      </div>
    </div>
  );
}