"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  
  // Data Profil
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_seed: 'RetroFin'
  });

  // Ambil Data User & Profil
  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        setUserEmail(user.email || '');
        setUserId(user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_seed')
          .eq('id', user.id)
          .single();

        if (data) {
          setFormData({
            full_name: data.full_name || '',
            avatar_seed: data.avatar_seed || 'RetroFin'
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  // Update Profil
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
        });

      if (error) throw error;
      alert("PROFIL DIPERBARUI. [OK]");
    } catch (error: any) {
      alert("ERROR: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Fungsi Logout
  const handleLogout = async () => {
    if (!window.confirm("AKHIRI SESI?")) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Fungsi Manual Toggle Dark Mode (Menambahkan class 'dark' ke elemen <html>)
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  if (loading) return <div className="p-10 font-bold uppercase text-2xl">MEMUAT DATA...</div>;

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
            {/* Menggunakan image tag standar untuk simplicity karena eksternal API */}
            <img 
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${formData.avatar_seed}`} 
              alt="Retro Avatar" 
              className="w-full h-full object-contain pixelated"
            />
          </div>

          <p className="font-bold uppercase text-xl mb-1">{formData.full_name || 'USER_NAME'}</p>
          <p className="font-bold text-sm bg-white dark:bg-black px-2 py-1 border-2 border-black">
            {userEmail}
          </p>

          <button 
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
                className="border-4 border-black p-3 font-bold focus:bg-yellow-100 dark:focus:bg-purple-900 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1 dark:text-white">Seed Avatar (Kode Unik)</label>
              <input 
                type="text" 
                value={formData.avatar_seed}
                onChange={(e) => setFormData({...formData, avatar_seed: e.target.value})}
                placeholder="Ketik kata acak untuk ganti avatar"
                className="border-4 border-black p-3 font-bold focus:bg-yellow-100 dark:focus:bg-purple-900 focus:outline-none"
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