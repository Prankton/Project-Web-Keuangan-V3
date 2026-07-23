"use client";

import React, { useEffect, useState } from 'react';

// Fungsi pengekspor perintah global
export const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
  }
};

export default function RetroToast() {
  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast(e.detail);
      // Hilangkan otomatis setelah 3.5 detik
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  if (!toast) return null;

  const bgColors = {
    success: 'bg-green-400 text-black',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-400 text-black'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] animate-bounce pointer-events-none">
      <div className={`border-4 border-black px-6 py-4 font-bold uppercase tracking-wider shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 ${bgColors[toast.type as keyof typeof bgColors]}`}>
        <span className="text-xl">
          {icons[toast.type as keyof typeof icons]}
        </span>
        <span className="text-sm md:text-base">{toast.message}</span>
      </div>
    </div>
  );
}