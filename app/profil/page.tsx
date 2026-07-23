"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { showToast } from '@/components/RetroToast';

type Debt = {
  id: string;
  type: 'utang' | 'piutang';
  person_name: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: 'belum_lunas' | 'lunas';
};

export default function ProfilPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_seed: 'RetroFin',
    cycle_date: 1
  });

  const [debts, setDebts] = useState<Debt[]>([]);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState({ type: 'utang', person_name: '', amount: '', due_date: '' });

  // State untuk Target Anggaran
  const [budgets, setBudgets] = useState<any[]>([]);
  const [newBudgetCategory, setNewBudgetCategory] = useState('Makan');
  const [newBudgetTarget, setNewBudgetTarget] = useState('');

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { router.push('/login'); return; }

        setUserEmail(user.email || '');
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_seed, cycle_date')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            avatar_seed: profile.avatar_seed || 'RetroFin',
            cycle_date: profile.cycle_date || 1
          });
        }

        const { data: debtsData } = await supabase.from('debts').select('*').order('due_date', { ascending: true });
        if (debtsData) {
          const sanitized = debtsData.map(d => ({
            ...d,
            amount: Number(d.amount) || 0,
            paid_amount: Number(d.paid_amount) || 0
          }));
          setDebts(sanitized);
        }

        // Load Target Anggaran dari LocalStorage
        const savedBudgets = localStorage.getItem('retrofin_budgets');
        if (savedBudgets) {
          try { setBudgets(JSON.parse(savedBudgets)); } catch (e) { setBudgets([]); }
        } else {
          setBudgets([{ category: 'Makan', target: 3000000 }, { category: 'Bensin', target: 1000000 }]);
        }

      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [router, supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: formData.full_name,
        avatar_seed: formData.avatar_seed,
        cycle_date: Number(formData.cycle_date),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      showToast("PROFIL & SIKLUS BERHASIL DISIMPAN!", "success");
    } catch (error: any) {
      showToast("GAGAL: " + error.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("KELUAR DARI APLIKASI?")) return;
    await supabase.auth.signOut();
    showToast("LOGOUT BERHASIL.", "warning");
    router.push('/login');
  };

  const fetchDebts = async () => {
    const { data } = await supabase.from('debts').select('*').order('due_date', { ascending: true });
    if (data) {
      setDebts(data.map(d => ({ ...d, amount: Number(d.amount) || 0, paid_amount: Number(d.paid_amount) || 0 })));
    }
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('debts').insert([{
        id: crypto.randomUUID(),
        user_id: userId,
        type: debtForm.type,
        person_name: debtForm.person_name,
        amount: parseFloat(debtForm.amount),
        paid_amount: 0,
        due_date: debtForm.due_date,
        status: 'belum_lunas'
      }]);
      if (error) throw error;
      showToast("KASBON DICATAT.", "success");
      setDebtForm({ type: 'utang', person_name: '', amount: '', due_date: '' });
      fetchDebts();
    } catch (err: any) {
      showToast("GAGAL: " + err.message, "error");
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm("HAPUS KASBON INI?")) return;
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) showToast("GAGAL", "error");
    else { showToast("DIHAPUS", "success"); fetchDebts(); }
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

    if (error) showToast("GAGAL", "error");
    else { showToast("DIUPDATE", "success"); setEditingDebt(null); fetchDebts(); }
  };

  // Fungsi Tambah Target Anggaran
  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetTarget) return;
    const updated = [...budgets, { category: newBudgetCategory, target: Number(newBudgetTarget) }];
    setBudgets(updated);
    localStorage.setItem('retrofin_budgets', JSON.stringify(updated));
    setNewBudgetTarget('');
    showToast("TARGET ANGGARAN DITAMBAHKAN!", "success");
  };

  const handleDeleteBudget = (index: number) => {
    const updated = budgets.filter((_, i) => i !== index);
    setBudgets(updated);
    localStorage.setItem('retrofin_budgets', JSON.stringify(updated));
    showToast("TARGET DIHAPUS", "warning");
  };

  if (loading) return <div className="min-h-screen p-10 flex items-center justify-center font-bold text-2xl uppercase">MEMUAT PROFIL...</div>;

  return (
    <div className="min-h-screen p-6 md:p-12 text-black dark:text-white">
      <button type="button" onClick={() => router.push('/')} className="mb-8 retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
        {"< KEMBALI KE DASHBOARD"}
      </button>

      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* PROFIL & SIKLUS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-cyan-300 dark:bg-cyan-900 border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center h-fit">
            <h2 className="w-full bg-black text-white p-2 font-bold uppercase border-2 border-black mb-4">ID CARD</h2>
            <div className="w-40 h-40 bg-white border-4 border-black mb-4 flex items-center justify-center p-2">
              <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(formData.avatar_seed || 'RetroFin')}`} alt="Avatar" className="w-full h-full object-contain pixelated" />
            </div>
            <p className="font-bold uppercase text-xl mb-1">{formData.full_name || 'USER'}</p>
            <p className="font-bold text-sm bg-white dark:bg-black px-2 py-1 border-2 border-black break-all">{userEmail}</p>
            <button type="button" onClick={() => document.documentElement.classList.toggle('dark')} className="mt-6 w-full bg-yellow-400 text-black border-4 border-black py-2 font-bold uppercase retro-btn cursor-pointer">TOGGLE TEMA</button>
          </div>
          
          <div className="md:col-span-2 bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-3xl font-bold uppercase mb-6 border-b-4 border-black pb-2">PENGATURAN_AKUN.CFG</h2>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
              <div>
                <label className="font-bold uppercase mb-1 text-sm block">Nama Pengguna</label>
                <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 w-full focus:outline-none" />
              </div>
              <div>
                <label className="font-bold uppercase mb-1 text-sm block">Seed Avatar</label>
                <input type="text" value={formData.avatar_seed} onChange={(e) => setFormData({...formData, avatar_seed: e.target.value})} className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 w-full focus:outline-none" />
              </div>
              <div>
                <label className="font-bold uppercase mb-1 text-sm block">Tanggal Mulai Siklus Gajian (1 - 31)</label>
                <input type="number" min="1" max="31" value={formData.cycle_date} onChange={(e) => setFormData({...formData, cycle_date: Number(e.target.value)})} className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 w-full focus:outline-none" required />
              </div>
              <div className="mt-4 pt-4 border-t-4 border-black border-dashed flex justify-between items-center gap-4">
                <button type="submit" disabled={updating} className="bg-green-400 text-black border-4 border-black px-6 py-3 font-bold uppercase retro-btn cursor-pointer">SIMPAN</button>
                <button type="button" onClick={handleLogout} className="bg-red-500 text-white border-4 border-black px-6 py-3 font-bold uppercase retro-btn cursor-pointer">LOGOUT</button>
              </div>
            </form>
          </div>
        </div>

        {/* KELOLA TARGET ANGGARAN */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-bold uppercase border-b-4 border-black pb-3 mb-6">KELOLA TARGET ANGGARAN</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleAddBudget} className="flex flex-col gap-3 bg-gray-100 dark:bg-gray-900 border-4 border-black p-4 h-fit">
              <h3 className="font-bold uppercase text-lg bg-yellow-300 text-black p-1 border-2 border-black text-center">+ TARGET BARU</h3>
              <div>
                <label className="font-bold text-xs uppercase block">Kategori</label>
                <select value={newBudgetCategory} onChange={(e) => setNewBudgetCategory(e.target.value)} className="w-full border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none">
                  <option value="Makan">Makan</option>
                  <option value="Bensin">Bensin</option>
                  <option value="Motor">Motor</option>
                  <option value="Jajan">Jajan</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-xs uppercase block">Target Nominal (Rp)</label>
                <input type="number" required placeholder="1000000" value={newBudgetTarget} onChange={(e) => setNewBudgetTarget(e.target.value)} className="w-full border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none" />
              </div>
              <button type="submit" className="bg-blue-400 text-black border-2 border-black p-2 font-bold uppercase retro-btn mt-2 cursor-pointer">SIMPAN TARGET</button>
            </form>

            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-black text-white dark:bg-white dark:text-black uppercase text-sm">
                    <th className="p-3 border-2 border-black">Kategori</th>
                    <th className="p-3 border-2 border-black text-right">Target Bulanan</th>
                    <th className="p-3 border-2 border-black text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr><td colSpan={3} className="text-center font-bold uppercase py-4">Belum ada target anggaran.</td></tr>
                  ) : budgets.map((b, idx) => (
                    <tr key={idx} className="border-2 border-black text-sm">
                      <td className="p-3 font-bold uppercase">{b.category}</td>
                      <td className="p-3 text-right font-bold">Rp {Number(b.target || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3 text-center">
                        <button type="button" onClick={() => handleDeleteBudget(idx)} className="bg-red-400 text-black border border-black px-2 py-1 font-bold text-xs retro-btn cursor-pointer">DEL</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KELOLA KASBON */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-bold uppercase border-b-4 border-black pb-3 mb-6">KELOLA BUKU KASBON</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleAddDebt} className="flex flex-col gap-3 bg-gray-100 dark:bg-gray-900 border-4 border-black p-4 h-fit">
              <h3 className="font-bold uppercase text-lg bg-yellow-300 text-black p-1 border-2 border-black text-center">+ KASBON BARU</h3>
              <div>
                <label className="font-bold text-xs uppercase block">Jenis</label>
                <select value={debtForm.type} onChange={(e) => setDebtForm({...debtForm, type: e.target.value as any})} className="w-full border-2 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none">
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

            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-black text-white dark:bg-white dark:text-black uppercase text-sm">
                    <th className="p-2 border-2 border-black">Jenis</th>
                    <th className="p-2 border-2 border-black">Nama</th>
                    <th className="p-2 border-2 border-black text-right">Total</th>
                    <th className="p-2 border-2 border-black text-right">Sisa</th>
                    <th className="p-2 border-2 border-black text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center font-bold uppercase py-4">Belum ada kasbon.</td></tr>
                  ) : debts.map((d) => (
                    <tr key={d.id} className="border-2 border-black text-sm">
                      <td className={`p-2 font-bold uppercase ${d.type === 'utang' ? 'text-red-500' : 'text-green-500'}`}>{d.type}</td>
                      <td className="p-2 font-bold">{d.person_name}</td>
                      <td className="p-2 text-right font-bold">Rp {(Number(d.amount) || 0).toLocaleString('id-ID')}</td>
                      <td className="p-2 text-right font-bold">Rp {Math.max(0, (Number(d.amount) || 0) - (Number(d.paid_amount) || 0)).toLocaleString('id-ID')}</td>
                      <td className="p-2 text-center space-x-1">
                        <button type="button" onClick={() => setEditingDebt(d)} className="bg-blue-300 text-black border border-black px-2 py-1 font-bold text-xs retro-btn cursor-pointer">EDIT</button>
                        <button type="button" onClick={() => handleDeleteDebt(d.id)} className="bg-red-400 text-black border border-black px-2 py-1 font-bold text-xs retro-btn cursor-pointer">DEL</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold text-xl uppercase mb-4 border-b-4 border-black pb-2">EDIT KASBON</h3>
            <form onSubmit={handleSaveEditDebt} className="flex flex-col gap-3">
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