"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CategoryChart from '@/components/CategoryChart';
import { createBrowserClient } from '@supabase/ssr';

export default function Dashboard() {
  const [data, setData] = useState({
    totalSaldo: 0,
    pemasukanBulanIni: 0,
    pengeluaranBulanIni: 0,
    recentTransactions: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactions && !error) {
        let totalSaldo = 0;
        let pemasukanBulanIni = 0;
        let pengeluaranBulanIni = 0;

        transactions.forEach((trx) => {
          const amount = Number(trx.amount) || 0;
          if (trx.type === 'pemasukan') {
            totalSaldo += amount;
            if (trx.date >= startOfMonth && trx.date <= endOfMonth) {
              pemasukanBulanIni += amount;
            }
          } else if (trx.type === 'pengeluaran') {
            totalSaldo -= amount;
            if (trx.date >= startOfMonth && trx.date <= endOfMonth) {
              pengeluaranBulanIni += amount;
            }
          }
        });

        setData({
          totalSaldo,
          pemasukanBulanIni,
          pengeluaranBulanIni,
          recentTransactions: transactions.slice(0, 5)
        });
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 md:p-12 flex items-center justify-center font-bold text-2xl uppercase dark:text-white">
        MEMUAT DATA DASHBOARD...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 border-4 border-black bg-white dark:bg-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#4dff4d]">
        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-black dark:text-white">
          RetroFin 98
        </h1>
        <div className="flex gap-2 md:gap-4">
          <Link 
            href="/transaksi" 
            className="retro-btn bg-yellow-300 dark:bg-purple-600 text-black dark:text-white border-4 border-black p-2 font-bold text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
          >
            + Transaksi
          </Link>
          <Link 
            href="/profil" 
            className="retro-btn bg-gray-300 dark:bg-gray-700 text-black dark:text-white border-4 border-black p-2 font-bold text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
          >
            Profil
          </Link>
        </div>
      </header>

      {/* Ringkasan Saldo Dinamis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-cyan-300 dark:bg-cyan-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] text-black dark:text-white">
          <h2 className="text-xl uppercase mb-2 font-bold">Total Saldo</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.totalSaldo.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-green-400 dark:bg-green-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] text-black dark:text-white">
          <h2 className="text-xl uppercase mb-2 font-bold">Pemasukan Bulan Ini</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.pemasukanBulanIni.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-pink-400 dark:bg-pink-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] text-black dark:text-white">
          <h2 className="text-xl uppercase mb-2 font-bold">Pengeluaran Bulan Ini</h2>
          <p className="text-3xl lg:text-4xl font-bold">Rp {data.pengeluaranBulanIni.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Aktivitas Terkini (Data Asli dari Supabase) */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
          <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4">
            <h2 className="text-2xl font-bold uppercase text-black dark:text-white">Aktivitas Terkini</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black border-dashed text-black dark:text-white">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((trx) => (
                    <tr key={trx.id} className="border-b-2 border-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">
                      <td className="py-3 font-bold">{trx.date}</td>
                      <td>{trx.category}</td>
                      <td className={`text-right font-bold ${trx.type === 'pemasukan' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {trx.type === 'pemasukan' ? '+' : '-'}Rp {Number(trx.amount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center font-bold uppercase text-black dark:text-white">
                      BELUM ADA TRANSAKSI TERCATAT.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Link href="/histori" className="block text-center w-full mt-6 retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black p-2 font-bold uppercase hover:bg-gray-800 transition-colors">
            Lihat Semua Histori
          </Link>
        </div>

        {/* Grafik Pengeluaran */}
        <div>
          <CategoryChart />
        </div>
      </div>
    </div>
  );
}    full_name: '',
    avatar_seed: 'RetroFin'
  });

  // --- STATE TARGET ANGGARAN ---
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // --- STATE KASBON ---
  const [debts, setDebts] = useState<Debt[]>([]);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState({
    type: 'utang',
    person_name: '',
    amount: '',
    due_date: '',
  });

  // --- AMBIL SEMUA DATA SAAT DIMUAT ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        setUserEmail(user.email || '');
        setUserId(user.id);

        // 1. Ambil Profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_seed')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            avatar_seed: profile.avatar_seed || 'RetroFin'
          });
        }

        // 2. Ambil Kasbon
        const { data: debtsData } = await supabase
          .from('debts')
          .select('*')
          .order('due_date', { ascending: true });
        
        if (debtsData) setDebts(debtsData as Debt[]);

        // 3. Ambil Target Anggaran (dari LocalStorage)
        const savedBudgets = localStorage.getItem('retrofin_budgets');
        if (savedBudgets) {
          setBudgets(JSON.parse(savedBudgets));
        } else {
          const defaultBudgets = [
            { category: 'Makan', target: 3000000 },
            { category: 'Transportasi', target: 1000000 }
          ];
          setBudgets(defaultBudgets);
          localStorage.setItem('retrofin_budgets', JSON.stringify(defaultBudgets));
        }

      } catch (error) {
        console.error('Gagal memuat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [router, supabase]);

  // ==========================================
  // LOGIKA PROFIL
  // ==========================================
  const handleUpdateProfile = async (e: React.FormEvent) => {
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

  const handleLogout = async () => {
    if (!window.confirm("AKHIRI SESI DAN KELUAR?")) return;
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  // ==========================================
  // LOGIKA TARGET ANGGARAN (BUDGETING)
  // ==========================================
  const saveBudgetsToStorage = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem('retrofin_budgets', JSON.stringify(newBudgets));
  };

  const handleAddBudget = () => {
    const category = prompt("NAMA KATEGORI ANGGARAN (Contoh: Hiburan, Tagihan):");
    const targetStr = prompt("LIMIT NOMINAL (Contoh: 1500000):");
    if (category && targetStr) {
      const updated = [...budgets, { category, target: Number(targetStr) }];
      saveBudgetsToStorage(updated);
    }
  };

  const handleEditBudget = (index: number) => {
    const current = budgets[index];
    const newTarget = prompt(`UBAH LIMIT TARGET [${current.category.toUpperCase()}]:`, String(current.target));
    if (newTarget) {
      const updated = [...budgets];
      updated[index].target = Number(newTarget);
      saveBudgetsToStorage(updated);
    }
  };

  const handleDeleteBudget = (index: number) => {
    if (window.confirm(`HAPUS TARGET ANGGARAN "${budgets[index].category.toUpperCase()}"?`)) {
      const updated = budgets.filter((_, i) => i !== index);
      saveBudgetsToStorage(updated);
    }
  };

  // ==========================================
  // LOGIKA KASBON (UTANG/PIUTANG)
  // ==========================================
  const fetchDebts = async () => {
    const { data } = await supabase.from('debts').select('*').order('due_date', { ascending: true });
    if (data) setDebts(data as Debt[]);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('debts').insert([{
        user_id: userId,
        type: debtForm.type,
        person_name: debtForm.person_name,
        amount: parseFloat(debtForm.amount),
        due_date: debtForm.due_date,
        status: 'belum_lunas'
      }]);
      if (error) throw error;
      alert("KASBON BERHASIL DICATAT. [OK]");
      setDebtForm({ type: 'utang', person_name: '', amount: '', due_date: '' });
      fetchDebts();
    } catch (err: any) {
      alert("ERROR: " + err.message);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm("HAPUS DATA KASBON INI PERMANEN?")) return;
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) {
      alert("GAGAL MENGHAPUS: " + error.message);
    } else {
      fetchDebts();
    }
  };

  const handleSaveEditDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;
    const { error } = await supabase.from('debts').update({
      type: editingDebt.type,
      person_name: editingDebt.person_name,
      amount: Number(editingDebt.amount),
      due_date: editingDebt.due_date,
    }).eq('id', editingDebt.id);

    if (error) {
      alert("GAGAL MEMPERBARUI: " + error.message);
    } else {
      alert("KASBON DIPERBARUI. [OK]");
      setEditingDebt(null);
      fetchDebts();
    }
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase.from('debts').update({ status: 'lunas' }).eq('id', id);
    if (error) {
      alert("GAGAL MENGUBAH STATUS: " + error.message);
    } else {
      fetchDebts();
    }
  };

  // --- TAMPILAN LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen p-10 flex items-center justify-center font-bold uppercase text-2xl dark:text-white">
        MEMUAT DATA SISTEM...
      </div>
    );
  }

  // --- TAMPILAN UTAMA ---
  return (
    <div className="min-h-screen p-6 md:p-12">
      
      {/* Tombol Kembali */}
      <button 
        type="button"
        onClick={() => router.push('/')}
        className="mb-8 retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
      >
        {"< KEMBALI KE DASHBOARD"}
      </button>

      {/* Kontainer Utama */}
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* ========================================== */}
        {/* SECTION 1: PROFIL & TEMA */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Avatar Pixel Art dari DiceBear */}
          <div className="md:col-span-1 bg-cyan-300 dark:bg-cyan-900 border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center h-fit">
            <h2 className="w-full bg-black text-white p-2 font-bold uppercase border-2 border-black mb-4">
              ID CARD
            </h2>
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

          {/* Form Pengaturan Profil */}
          <div className="md:col-span-2 bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#4dff4d]">
            <h2 className="text-3xl font-bold uppercase mb-6 border-b-4 border-black pb-2 dark:text-white">
              PENGATURAN_AKUN.CFG
            </h2>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
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

        {/* ========================================== */}
        {/* SECTION 2: KELOLA TARGET ANGGARAN */}
        {/* ========================================== */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#4dff4d]">
          <div className="flex justify-between items-center border-b-4 border-black pb-3 mb-6">
            <h2 className="text-2xl font-bold uppercase dark:text-white">KELOLA TARGET ANGGARAN</h2>
            <button type="button" onClick={handleAddBudget} className="bg-yellow-300 dark:bg-purple-600 text-black dark:text-white border-4 border-black px-3 py-1 font-bold uppercase retro-btn text-sm">
              + TAMBAH TARGET
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.length === 0 && (
              <p className="font-bold uppercase text-gray-500 dark:text-gray-400">Belum ada target anggaran.</p>
            )}
            {budgets.map((b, idx) => (
              <div key={idx} className="border-4 border-black p-4 flex justify-between items-center bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
                <div>
                  <p className="font-bold text-lg uppercase">{b.category}</p>
                  <p className="font-bold text-sm text-gray-600 dark:text-gray-400">Target: Rp {b.target.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEditBudget(idx)} className="bg-blue-400 text-black border-2 border-black px-2 py-1 font-bold text-xs uppercase retro-btn cursor-pointer">
                    EDIT
                  </button>
                  <button type="button" onClick={() => handleDeleteBudget(idx)} className="bg-red-400 text-black border-2 border-black px-2 py-1 font-bold text-xs uppercase retro-btn cursor-pointer">
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================== */}
        {/* SECTION 3: KELOLA KASBON (UTANG/PIUTANG) */}
        {/* ========================================== */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#4dff4d]">
          <h2 className="text-2xl font-bold uppercase border-b-4 border-black pb-3 mb-6 dark:text-white">
            KELOLA BUKU KASBON
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Tambah Kasbon */}
            <form onSubmit={handleAddDebt} className="flex flex-col gap-3 bg-gray-100 dark:bg-gray-900 border-4 border-black p-4 text-black dark:text-white">
              <h3 className="font-bold uppercase text-lg bg-yellow-300 text-black p-1 border-2 border-black text-center">+ KASBON BARU</h3>
              <div>
                <label className="font-bold text-xs uppercase block">Jenis</label>
                <select value={debtForm.type} onChange={(e) => setDebtForm({...debtForm, type: e.target.value as any})} className="w-full border-2 border-black p-2 font-bold bg-white dark:bg-black text-black dark:text-white focus:outline-none">
                  <option value="utang">UTANG SAYA (-)</option>
                  <option value="piutang">PIUTANG SAYA (+)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-xs uppercase block">Nama Pihak</label>
                <input type="text" required value={debtForm.person_name} onChange={(e) => setDebtForm({...debtForm, person_name: e.target.value})} className="w-full border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none" />
              </div>
              <div>
                <label className="font-bold text-xs uppercase block">Jumlah (Rp)</label>
                <input type="number" required value={debtForm.amount} onChange={(e) => setDebtForm({...debtForm, amount: e.target.value})} className="w-full border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none" />
              </div>
              <div>
                <label className="font-bold text-xs uppercase block">Jatuh Tempo</label>
                <input type="date" required value={debtForm.due_date} onChange={(e) => setDebtForm({...debtForm, due_date: e.target.value})} className="w-full border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none" />
              </div>
              <button type="submit" className="bg-blue-400 text-black border-2 border-black p-2 font-bold uppercase retro-btn mt-2 cursor-pointer">SIMPAN KASBON</button>
            </form>

            {/* Tabel Daftar Kasbon */}
            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-black text-white dark:bg-white dark:text-black uppercase text-sm">
                    <th className="p-2 border-2 border-black">Jenis</th>
                    <th className="p-2 border-2 border-black">Nama</th>
                    <th className="p-2 border-2 border-black text-right">Jumlah</th>
                    <th className="p-2 border-2 border-black">Status</th>
                    <th className="p-2 border-2 border-black text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center font-bold uppercase py-4 dark:text-white">Belum ada catatan kasbon.</td></tr>
                  ) : debts.map((d) => (
                    <tr key={d.id} className="border-2 border-black hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-black dark:text-white">
                      <td className={`p-2 font-bold uppercase ${d.type === 'utang' ? 'text-red-500' : 'text-green-500'}`}>{d.type}</td>
                      <td className="p-2 font-bold">{d.person_name}</td>
                      <td className="p-2 text-right font-bold">Rp {d.amount.toLocaleString('id-ID')}</td>
                      <td className="p-2 font-bold uppercase">{d.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}</td>
                      <td className="p-2 text-center space-x-1">
                        <button type="button" onClick={() => setEditingDebt(d)} className="bg-blue-300 text-black border border-black px-1 font-bold text-xs retro-btn cursor-pointer">EDIT</button>
                        <button type="button" onClick={() => handleDeleteDebt(d.id)} className="bg-red-400 text-black border border-black px-1 font-bold text-xs retro-btn cursor-pointer">DEL</button>
                        {d.status !== 'lunas' && (
                          <button type="button" onClick={() => markAsPaid(d.id)} className="bg-green-400 text-black border border-black px-1 font-bold text-xs retro-btn cursor-pointer">LUNAS</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL EDIT KASBON */}
      {/* ========================================== */}
      {editingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-gray-200 dark:bg-gray-800 border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold text-xl uppercase mb-4 border-b-4 border-black pb-2 dark:text-white">EDIT KASBON</h3>
            <form onSubmit={handleSaveEditDebt} className="flex flex-col gap-3 text-black dark:text-white">
              <input type="text" value={editingDebt.person_name} onChange={(e) => setEditingDebt({...editingDebt, person_name: e.target.value})} className="border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none" required />
              <input type="number" value={editingDebt.amount} onChange={(e) => setEditingDebt({...editingDebt, amount: Number(e.target.value)})} className="border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none" required />
              <input type="date" value={editingDebt.due_date} onChange={(e) => setEditingDebt({...editingDebt, due_date: e.target.value})} className="border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none" required />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="flex-1 bg-green-400 text-black border-2 border-black p-2 font-bold retro-btn cursor-pointer">SIMPAN</button>
                <button type="button" onClick={() => setEditingDebt(null)} className="flex-1 bg-red-400 text-black border-2 border-black p-2 font-bold retro-btn cursor-pointer">BATAL</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
