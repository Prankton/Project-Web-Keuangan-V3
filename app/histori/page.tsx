"use client";

import React from 'react';
import Link from 'next/link';
import HistoryTable from '@/components/HistoryTable';

export default function HistoriPage() {
  return (
    <div className="min-h-screen p-6 md:p-12 text-black dark:text-white">
      
      {/* Header Navigasi */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 border-4 border-black bg-white dark:bg-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#4dff4d] gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black px-3 py-1 font-bold text-sm uppercase"
          >
            {"< DASHBOARD"}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest">
            HISTORI TRANSAKSI
          </h1>
        </div>

        <Link 
          href="/transaksi" 
          className="retro-btn bg-yellow-300 dark:bg-purple-600 text-black dark:text-white border-4 border-black px-4 py-2 font-bold text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
        >
          + TRANSAKSI BARU
        </Link>
      </header>

      {/* Tabel Histori Utama */}
      <HistoryTable />

    </div>
  );
}