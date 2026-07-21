"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function ProfilPage() {
  const router = useRouter();

  // Inisialisasi Supabase khusus Client Component untuk membaca Session Cookie
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  // Data Form Profil
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_seed: 'RetroFin'
  });

  // Ambil Data User & Profil saat Komponen Dimuat
  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        setUserEmail(user.email || '');
        setUserId(user.id);

        // Ambil data profil pengguna dari tabel 'profiles'
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_seed')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setFormData({
            full_name: data.full_name || '',
            avatar_seed: data.avatar_seed || 'RetroFin'
          });
        }
      } catch (error) {
        console.error('Gagal memuat profil:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router, supabase]);

  // Simpan Perubahan Profil
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: formData.full_name,
          avatar_seed: formData.avatar_seed,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      alert("PROFIL DIPERBARUI. [OK]");
    } catch (error: any) {
      alert("ERROR: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Fungsi Logout Sesi
  const handleLogout = async () => {
    if (!window.confirm("AKHIRI SESI DAN KELUAR?")) return;
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  // Toggle Dark/Light Mode
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-10 flex items-center justify-center font-bold uppercase text-2xl dark:text-white">
        MEMUAT DATA PROFIL...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      
      {/* Header Navigasi */}
      <button 
        onClick={() => router.push('/')}
        className="mb-8 retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
      >
        {"< KEMBALI KE DASHBOARD"}
      </button>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* --- KARTU IDENTITAS (AVATAR) --- */}
        <div className="md:col-span-1 bg-cyan-300 dark:bg-cyan-900 border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center h-fit">
          <h2 className="w-full bg-black text-white p-2 font-bold uppercase border-2 border-black mb-4">
            ID CARD
          </h2>
          
          {/* Avatar Pixel Art dari DiceBear */}
          <div className="w-40 h-40 bg-white border-4 border-black mb-4 flex items-center justify-center p-2 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            <img 
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(formData.avatar_seed || 'RetroFin')}`} 
              alt="Retro Avatar" 
              className="w-full h-full object-contain pixelated"
            />
          </div>

          <p className="font-bold uppercase text-xl mb-1 text-black dark:text-white">{formData.full_name || 'USER_NAME'}</p>
          <p className="font-bold text-sm bg-white dark:bg-black text-black dark:text-white px-2 py-1 border-2 border-black break-all">
            {userEmail}
          </p>

          <button 
            type="button"
            onClick={toggleTheme}
            className="mt-6 w-full bg-yellow-400 hover:bg-yellow-500 text-black border-4 border-black py-2 font-bold uppercase retro-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            TOGGLE TEMA (DARK/LIGHT)
          </button>
        </div>

        {/* --- PENGATURAN PROFIL --- */}
        <div className="md:col-span-2 bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#4dff4d]">
          <h2 className="text-3xl font-bold uppercase mb-6 border-b-4 border-black pb-2 dark:text-white">
            PENGATURAN_SISTEM.CFG
          </h2>

          <form onSubmit={handleUpdate} className="flex flex-col gap-5">
            
            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1 dark:text-white">Nama Pengguna</label>
              <input 
                type="text" 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Masukkan Nama Anda"
                className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 text-black dark:text-white focus:bg-yellow-100 dark:focus:bg-purple-900 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1 dark:text-white">Seed Avatar (Kode Unik)</label>
              <input 
                type="text" 
                value={formData.avatar_seed}
                onChange={(e) => setFormData({...formData, avatar_seed: e.target.value})}
                placeholder="Ketik kata acak untuk ganti avatar"
                className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 text-black dark:text-white focus:bg-yellow-100 dark:focus:bg-purple-900 focus:outline-none"
              />
              <p className="text-sm font-bold mt-1 text-gray-600 dark:text-gray-400">
                *Ketik kata apapun (misal: "Budi", "Gamer", "123") untuk menghasilkan avatar pixel yang unik.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t-4 border-black border-dashed flex flex-col sm:flex-row justify-between items-center gap-4">
              <button 
                type="submit" 
                disabled={updating}
                className="w-full sm:w-auto bg-green-400 hover:bg-green-500 text-black border-4 border-black px-6 py-3 font-bold text-xl uppercase retro-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {updating ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
              </button>

              <button 
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white border-4 border-black px-6 py-3 font-bold text-xl uppercase retro-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                LOGOUT SYSTEM
              </button>
            </div>
          </form>
        </div>
        
      </div>
    </div>
  );
}