"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function ProfilPage() {
  const [userEmail, setUserEmail] = useState<string | null>('MEMUAT DATA...');
  const router = useRouter();

  // Inisialisasi Supabase untuk membaca sesi (cookie) di browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Mengambil data user yang sedang login saat halaman dimuat
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? 'TIDAK ADA EMAIL');
      } else {
        setUserEmail('USER TIDAK DITEMUKAN');
      }
    };
    getUser();
  }, [supabase.auth]);

  // Logika untuk tombol Logout
  const handleLogout = async () => {
    // 1. Hapus sesi di Supabase
    await supabase.auth.signOut();
    // 2. Refresh rute agar Middleware membaca cookie yang sudah kosong
    router.refresh();
    // 3. Arahkan kembali ke halaman Login
    router.push('/login');
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-[radial-gradient(#00000033_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]">
      
      {/* Kontainer Profil bergaya Retro */}
      <div className="w-full max-w-md bg-white dark:bg-black border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_#4dff4d]">
        
        <h1 className="text-3xl font-bold uppercase mb-8 border-b-4 border-black pb-2 text-center bg-blue-300 dark:bg-blue-900 text-black dark:text-white px-2 py-1">
          SYSTEM.PROFIL
        </h1>
        
        {/* Info Pengguna */}
        <div className="mb-10 text-center">
          <p className="font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
            Identitas Pengguna Aktif:
          </p>
          <div className="text-xl font-bold dark:text-white bg-gray-200 dark:bg-gray-800 p-3 border-4 border-black border-dashed break-all">
            {userEmail}
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col gap-4">
          <Link 
            href="/" 
            className="text-center retro-btn bg-yellow-300 hover:bg-yellow-400 dark:bg-purple-600 dark:hover:bg-purple-500 text-black dark:text-white border-4 border-black p-3 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
          >
            KEMBALI KE DASHBOARD
          </Link>
          
          <button 
            onClick={handleLogout}
            className="retro-btn bg-red-500 hover:bg-red-600 text-black border-4 border-black p-3 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
          >
            LOGOUT / KELUAR SISTEM
          </button>
        </div>

      </div>
    </div>
  );
}