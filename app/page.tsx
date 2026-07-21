import React from 'react';
// 1. Import Link untuk navigasi antar halaman di Next.js
import Link from 'next/link';
// 2. Import komponen grafik diletakkan di paling atas (bukan di bawah)
import CategoryChart from '@/components/CategoryChart'; 

export default function Dashboard() {
  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header & Dark/Light Mode Toggle Placeholder */}
      <header className="flex justify-between items-center mb-10 border-4 border-black bg-white dark:bg-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#4dff4d]">
        <h1 className="text-4xl font-bold uppercase tracking-widest">RetroFin 98</h1>
        <div className="flex gap-4">
          
          {/* 3. Tombol diubah menjadi <Link> agar bisa diklik dan pindah ke /transaksi */}
          <Link 
            href="/transaksi" 
            className="retro-btn bg-yellow-300 dark:bg-purple-600 text-black dark:text-white border-4 border-black p-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d] transition-all"
          >
            + Transaksi
          </Link>
          
          {/* 4. Tombol diubah menjadi <Link> menuju /profil */}
          <Link 
            href="/profil" 
            className="retro-btn bg-gray-300 dark:bg-gray-700 text-black dark:text-white border-4 border-black p-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d] transition-all"
          >
            Profil
          </Link>

        </div>
      </header>

      {/* Ringkasan Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-cyan-300 dark:bg-cyan-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <h2 className="text-xl uppercase mb-2">Total Saldo</h2>
          <p className="text-5xl font-bold">Rp 12.500.000</p>
        </div>
        <div className="bg-green-400 dark:bg-green-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <h2 className="text-xl uppercase mb-2">Pemasukan Bulan Ini</h2>
          <p className="text-5xl font-bold">Rp 15.000.000</p>
        </div>
        <div className="bg-pink-400 dark:bg-pink-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <h2 className="text-xl uppercase mb-2">Pengeluaran Bulan Ini</h2>
          <p className="text-5xl font-bold">Rp 2.500.000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Progress Bar Anggaran (Budgeting) */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <h2 className="text-2xl font-bold mb-4 uppercase border-b-4 border-black pb-2">Target Anggaran</h2>
          
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span>Makan & Minum</span>
              <span>Rp 1.5M / Rp 3M</span>
            </div>
            {/* Retro Progress Bar */}
            <div className="w-full h-6 border-4 border-black bg-gray-200 dark:bg-gray-800">
              <div className="h-full bg-yellow-400 dark:bg-yellow-500 w-1/2 border-r-4 border-black"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Transportasi</span>
              <span>Rp 800k / Rp 1M</span>
            </div>
            <div className="w-full h-6 border-4 border-black bg-gray-200 dark:bg-gray-800">
              <div className="h-full bg-red-500 dark:bg-red-600 w-4/5 border-r-4 border-black"></div>
            </div>
          </div>
        </div>

        {/* Daftar Aktivitas Terkini & Tabel */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4">
            <h2 className="text-2xl font-bold uppercase">Aktivitas Terkini</h2>
            <input 
              type="text" 
              placeholder="Cari..." 
              className="border-4 border-black p-1 text-sm bg-gray-100 dark:bg-gray-800 focus:outline-none"
            />
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black border-dashed">
                <th className="py-2">Tanggal</th>
                <th className="py-2">Kategori</th>
                <th className="py-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-2 border-black hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                <td className="py-3">18 Jul 2026</td>
                <td>Gaji Bulanan</td>
                <td className="text-right text-green-600 dark:text-green-400 font-bold">+Rp 15.000.000</td>
              </tr>
              <tr className="border-b-2 border-black hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                <td className="py-3">17 Jul 2026</td>
                <td>Makan Siang</td>
                <td className="text-right text-red-600 dark:text-red-400 font-bold">-Rp 50.000</td>
              </tr>
              <tr className="hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                <td className="py-3">15 Jul 2026</td>
                <td><span className="bg-blue-300 dark:bg-blue-800 text-black dark:text-white px-1 border-2 border-black">Utang</span> Budi</td>
                <td className="text-right text-red-600 dark:text-red-400 font-bold">-Rp 500.000</td>
              </tr>
            </tbody>
          </table>
          
          <Link href="/histori" className="block text-center w-full mt-6 retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black p-2 font-bold uppercase hover:bg-gray-800 transition-colors">
            Lihat Semua Histori
          </Link>
        </div>
      </div>

      {/* 5. Integrasi Chart ditempatkan di DALAM return */}
      <div className="mt-10">
        <CategoryChart />
      </div>

    </div>
  );
}