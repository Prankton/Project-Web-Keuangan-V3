"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MonthOverMonth() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    currentTotal: 0,
    prevTotal: 0,
    diffAmount: 0,
    diffPercent: 0,
    trend: 'sama', // 'naik', 'turun', 'sama'
  });

  useEffect(() => {
    const fetchMoMData = async () => {
      try {
        const now = new Date();
        
        // 1. Tentukan batas waktu Bulan Ini
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        // 2. Tentukan batas waktu Bulan Lalu
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

        // 3. Tarik data Pengeluaran Bulan Ini
        const { data: currentData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'pengeluaran')
          .gte('date', startOfCurrentMonth)
          .lte('date', endOfCurrentMonth);

        // 4. Tarik data Pengeluaran Bulan Lalu
        const { data: prevData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'pengeluaran')
          .gte('date', startOfPrevMonth)
          .lte('date', endOfPrevMonth);

        // 5. Kalkulasi Total
        const currentTotal = currentData?.reduce((sum, item) => sum + item.amount, 0) || 0;
        const prevTotal = prevData?.reduce((sum, item) => sum + item.amount, 0) || 0;

        // 6. Kalkulasi Selisih dan Persentase
        const diffAmount = currentTotal - prevTotal;
        let diffPercent = 0;
        
        if (prevTotal > 0) {
          diffPercent = (Math.abs(diffAmount) / prevTotal) * 100;
        } else if (prevTotal === 0 && currentTotal > 0) {
          diffPercent = 100; // Jika bulan lalu 0 dan sekarang ada pengeluaran
        }

        let trend = 'sama';
        if (currentTotal > prevTotal) trend = 'naik';
        else if (currentTotal < prevTotal) trend = 'turun';

        setData({
          currentTotal,
          prevTotal,
          diffAmount: Math.abs(diffAmount),
          diffPercent,
          trend
        });
      } catch (error) {
        console.error("Gagal menarik data MoM:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoMData();
  }, []);

  if (loading) {
    return (
      <div className="bg-black text-green-400 border-4 border-black p-6 font-bold uppercase animate-pulse">
        MENGKALKULASI SIKLUS BULANAN...
      </div>
    );
  }

  // Menentukan warna dan pesan berdasarkan tren (Untuk pengeluaran: turun = baik, naik = buruk)
  const isGood = data.trend === 'turun' || data.trend === 'sama';
  const bgColor = isGood ? 'bg-green-300 dark:bg-green-900' : 'bg-red-400 dark:bg-red-900';
  const trendSymbol = data.trend === 'naik' ? '▲' : data.trend === 'turun' ? '▼' : '■';

  return (
    <div className={`border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] ${bgColor}`}>
      <h2 className="text-2xl font-bold uppercase mb-4 border-b-4 border-black pb-2 text-black dark:text-white flex justify-between items-center">
        <span>ANALISIS MoM (PENGELUARAN)</span>
        <span className="text-sm bg-black text-white px-2 py-1">SYS.REPORT</span>
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6 text-black dark:text-white">
        <div className="border-4 border-black bg-white dark:bg-black p-3">
          <p className="font-bold text-sm uppercase mb-1">BULAN LALU</p>
          <p className="text-xl font-bold">Rp {data.prevTotal.toLocaleString('id-ID')}</p>
        </div>
        <div className="border-4 border-black bg-white dark:bg-black p-3">
          <p className="font-bold text-sm uppercase mb-1">BULAN INI</p>
          <p className="text-xl font-bold">Rp {data.currentTotal.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="border-4 border-black bg-white dark:bg-black p-4 text-center">
        <p className="font-bold text-lg uppercase dark:text-white mb-2">STATUS PERBANDINGAN:</p>
        
        <div className="flex justify-center items-center gap-3">
          <span className={`text-5xl ${isGood ? 'text-green-500' : 'text-red-500'}`}>
            {trendSymbol}
          </span>
          <div className="text-left">
            <p className="text-3xl font-bold dark:text-white">
              {data.diffPercent.toFixed(1)}%
            </p>
            <p className="font-bold uppercase text-sm dark:text-gray-400">
              {data.trend === 'naik' ? 'LEBIH BOROS' : data.trend === 'turun' ? 'LEBIH HEMAT' : 'STABIL'} (Rp {data.diffAmount.toLocaleString('id-ID')})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}