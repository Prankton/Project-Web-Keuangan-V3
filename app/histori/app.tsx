import React from 'react';
import Link from 'next/link';
// Memanggil komponen tabel histori yang sudah Anda buat sebelumnya
import HistoryTable from '@/components/HistoryTable'; 

export default function HistoriPage() {
  return (
    <div className="min-h-screen p-6 md:p-12">
      
      {/* Tombol Navigasi Kembali */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="retro-btn bg-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white border-4 border-black p-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d] transition-all inline-block"
        >
          &larr; KEMBALI KE DASHBOARD
        </Link>
      </div>

      {/* Menampilkan Tabel Histori */}
      <HistoryTable />
      
    </div>
  );
}