"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { showToast } from '@/components/RetroToast';

export default function SecurityWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    if (pathname === '/login') return;

    let timeoutId: NodeJS.Timeout;
    const TEN_MINUTES = 600000; 

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
         await supabase.auth.signOut();
         showToast("SESI HABIS (10 MENIT). OTOMATIS KELUAR.", "warning");
         router.push('/login');
      }, TEN_MINUTES);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearTimeout(timeoutId);
    };
  }, [router, supabase, pathname]);

  return <>{children}</>;
}