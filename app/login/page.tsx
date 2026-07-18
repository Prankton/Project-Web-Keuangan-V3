"use client";
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isLogin) {
        // Logika Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        setMessage({ text: 'LOGIN BERHASIL! MEMUAT SISTEM...', type: 'success' });
        // Redirect ke Dashboard setelah login berhasil
        setTimeout(() => router.push('/'), 1500);

      } else {
        // Logika Register
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        setMessage({ 
          text: 'REGISTRASI BERHASIL! CEK EMAIL UNTUK VERIFIKASI (JIKA DIAKTIFKAN), ATAU SILAKAN LOGIN.', 
          type: 'success' 
        });
        setIsLogin(true); // Pindah ke tab login setelah register
        setPassword('');
      }
    } catch (error: any) {
      setMessage({ text: `ERROR: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f0cb] dark:bg-[#1a1a2e] bg-[radial-gradient(#00000033_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]">
      
      {/* Container bergaya Jendela Retro */}
      <div className="w-full max-w-md bg-gray-200 dark:bg-gray-800 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_#4dff4d]">
        
        {/* Title Bar Jendela */}
        <div className="bg-blue-700 dark:bg-blue-900 border-b-4 border-black p-2 flex justify-between items-center text-white">
          <h1 className="font-bold tracking-widest uppercase">
            {isLogin ? 'SYSTEM.LOGIN.EXE' : 'SYSTEM.REGISTER.EXE'}
          </h1>
          {/* Tombol X Palsu bergaya retro */}
          <button className="bg-gray-300 text-black border-2 border-black border-t-white border-l-white border-b-black border-r-black w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-gray-400 active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
            X
          </button>
        </div>

        {/* Konten Form */}
        <div className="p-6">
          
          {/* Menampilkan Pesan Error / Success */}
          {message.text && (
            <div className={`mb-6 p-3 border-4 border-black font-bold uppercase ${
              message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-400 text-black'
            } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            
            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1 dark:text-white">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@retro.net"
                className="border-4 border-black p-3 font-bold bg-white dark:bg-black dark:text-white focus:outline-none focus:bg-yellow-100 dark:focus:bg-purple-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1 dark:text-white">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="border-4 border-black p-3 font-bold bg-white dark:bg-black dark:text-white focus:outline-none focus:bg-yellow-100 dark:focus:bg-purple-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 bg-yellow-400 hover:bg-yellow-300 dark:bg-purple-600 dark:hover:bg-purple-500 text-black dark:text-white border-4 border-black p-3 font-bold text-xl uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] retro-btn disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : (isLogin ? 'EXECUTE LOGIN' : 'CREATE ACCOUNT')}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-8 text-center border-t-4 border-black border-dashed pt-4">
            <p className="mb-2 dark:text-white">
              {isLogin ? "BELUM PUNYA AKSES?" : "SUDAH TERDAFTAR DI SISTEM?"}
            </p>
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage({ text: '', type: '' }); // Clear message on toggle
              }}
              className="bg-black text-white dark:bg-white dark:text-black border-4 border-black px-4 py-2 font-bold uppercase hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d] retro-btn"
            >
              {isLogin ? 'REGISTER DI SINI' : 'KEMBALI KE LOGIN'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}