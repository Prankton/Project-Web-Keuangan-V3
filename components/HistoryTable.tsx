"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { showToast } from '@/components/RetroToast';

export type Transaction = {
  id: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  payment_method?: string;
  date: string;
  notes?: string;
  receipt_url?: string;
};

export default function HistoriPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data as Transaction[]);
    } catch (err: any) {
      showToast("Gagal memuat histori: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("HAPUS PERMANEN TRANSAKSI INI?")) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      showToast("TRANSAKSI BERHASIL DIHAPUS.", "success");
      fetchTransactions();
    } catch (error: any) {
      showToast("GAGAL MENGHAPUS: " + error.message, "error");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          category: editingTrx.category,
          amount: Number(editingTrx.amount),
          date: editingTrx.date,
          type: editingTrx.type,
          notes: editingTrx.notes,
          payment_method: editingTrx.payment_method
        })
        .eq('id', editingTrx.id);

      if (error) throw error;
      showToast("TRANSAKSI DIPERBARUI.", "success");
      setEditingTrx(null);
      fetchTransactions();
    } catch (error: any) {
      showToast("GAGAL MEMPERBARUI: " + error.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Logika Filter (Pencarian Teks & Rentang Tanggal)
  const filteredTransactions = transactions.filter((trx) => {
    const q = searchQuery.toLowerCase();
    const cat = trx.category ? trx.category.toLowerCase().includes(q) : false;
    const note = trx.notes ? trx.notes.toLowerCase().includes(q) : false;
    const matchesSearch = cat || note;

    let matchesDate = true;
    if (startDate && trx.date < startDate) matchesDate = false;
    if (endDate && trx.date > endDate) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-screen p-6 md:p-12 text-black dark:text-white">
      
      {/* Header Navigasi */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 border-4 border-black bg-white dark:bg-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#4dff4d] gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black px-3 py-1 font-bold text-sm uppercase"
          >
            {"< DASHBOARD"}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest">
            HISTORI TRANSAKSI
          </h1>
        </div>

        <Link 
          href="/transaksi" 
          className="retro-btn bg-yellow-300 dark:bg-purple-600 text-black dark:text-white border-4 border-black px-4 py-2 font-bold text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
        >
          + TRANSAKSI BARU
        </Link>
      </header>

      {/* Kotak Filter & Pencarian */}
      <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3">
          <label className="block text-xs font-bold uppercase mb-1">Cari Kategori / Catatan</label>
          <input 
            type="text"
            placeholder="Ketik kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-4 border-black p-2 font-bold bg-gray-100 dark:bg-gray-800 text-black dark:text-white focus:outline-none w-full"
          />
        </div>

        <div className="w-full md:w-1/3 flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase mb-1">Dari Tanggal</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-4 border-black p-2 font-bold bg-gray-100 dark:bg-gray-800 text-black dark:text-white focus:outline-none w-full text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase mb-1">Sampai Tanggal</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-4 border-black p-2 font-bold bg-gray-100 dark:bg-gray-800 text-black dark:text-white focus:outline-none w-full text-sm"
            />
          </div>
        </div>

        <div className="w-full md:w-auto flex items-end">
          <button 
            type="button"
            onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); }}
            className="w-full md:w-auto mt-auto bg-gray-200 dark:bg-gray-800 border-4 border-black px-4 py-2 font-bold uppercase text-sm retro-btn"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Tabel Riwayat Lengkap */}
      <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#4dff4d]">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center font-bold text-xl uppercase">MEMUAT HISTORI...</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-black text-white dark:bg-white dark:text-black uppercase text-sm">
                  <th className="py-3 px-4 border-4 border-black">Tanggal</th>
                  <th className="py-3 px-4 border-4 border-black">Metode</th>
                  <th className="py-3 px-4 border-4 border-black">Kategori</th>
                  <th className="py-3 px-4 border-4 border-black">Catatan</th>
                  <th className="py-3 px-4 border-4 border-black text-right">Jumlah</th>
                  <th className="py-3 px-4 border-4 border-black text-center">Struk</th>
                  <th className="py-3 px-4 border-4 border-black text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-3 px-4 border-x-4 border-b-4 border-black font-bold">{trx.date}</td>
                      <td className="py-3 px-4 border-x-4 border-b-4 border-black uppercase text-xs font-bold">
                        <span className="bg-yellow-300 text-black px-2 py-1 border-2 border-black">
                          {trx.payment_method || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-x-4 border-b-4 border-black font-bold">{trx.category}</td>
                      <td className="py-3 px-4 border-x-4 border-b-4 border-black">{trx.notes || '-'}</td>
                      <td className={`py-3 px-4 border-x-4 border-b-4 border-black text-right font-bold ${trx.type === 'pemasukan' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {trx.type === 'pemasukan' ? '+' : '-'}Rp {Number(trx.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 border-x-4 border-b-4 border-black text-center">
                        {trx.receipt_url ? (
                          <a href={trx.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-bold text-sm">
                            LIHAT
                          </a>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 border-x-4 border-b-4 border-black text-center space-x-2">
                        <button type="button" onClick={() => setEditingTrx(trx)} className="bg-blue-400 text-black border-2 border-black px-2 py-1 text-xs font-bold retro-btn cursor-pointer">EDIT</button>
                        <button type="button" onClick={() => handleDelete(trx.id)} className="bg-red-400 text-black border-2 border-black px-2 py-1 text-xs font-bold retro-btn cursor-pointer">DEL</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center border-4 border-t-0 border-black font-bold uppercase text-xl bg-gray-100 dark:bg-gray-900">
                      TIDAK ADA TRANSAKSI DALAM RENTANG WAKTU INI.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Edit Transaksi (Modern-Retro) */}
      {editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-blue-600 border-b-4 border-black p-3 flex justify-between items-center text-white">
              <h1 className="font-bold tracking-widest uppercase">EDIT_TRANSAKSI.EXE</h1>
              <button type="button" onClick={() => setEditingTrx(null)} className="bg-gray-300 text-black border-2 border-black font-bold w-6 h-6 flex items-center justify-center text-sm cursor-pointer">X</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="font-bold uppercase text-xs block mb-1">Tipe</label>
                <select value={editingTrx.type} onChange={(e) => setEditingTrx({...editingTrx, type: e.target.value as any})} className="border-4 border-black p-2 font-bold bg-white dark:bg-black w-full focus:outline-none">
                  <option value="pengeluaran">PENGELUARAN (-)</option>
                  <option value="pemasukan">PEMASUKAN (+)</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase text-xs block mb-1">Kategori</label>
                <input type="text" value={editingTrx.category} onChange={(e) => setEditingTrx({...editingTrx, category: e.target.value})} className="border-4 border-black p-2 font-bold bg-white dark:bg-black w-full focus:outline-none" required />
              </div>

              <div>
                <label className="font-bold uppercase text-xs block mb-1">Jumlah (Rp)</label>
                <input type="number" value={editingTrx.amount} onChange={(e) => setEditingTrx({...editingTrx, amount: Number(e.target.value)})} className="border-4 border-black p-2 font-bold bg-white dark:bg-black w-full focus:outline-none" required />
              </div>

              <div>
                <label className="font-bold uppercase text-xs block mb-1">Tanggal</label>
                <input type="date" value={editingTrx.date} onChange={(e) => setEditingTrx({...editingTrx, date: e.target.value})} className="border-4 border-black p-2 font-bold bg-white dark:bg-black w-full focus:outline-none" required />
              </div>

              <div className="flex gap-4 mt-4">
                <button type="submit" disabled={isUpdating} className="flex-1 bg-green-400 text-black border-4 border-black py-2 font-bold uppercase retro-btn cursor-pointer">SIMPAN</button>
                <button type="button" onClick={() => setEditingTrx(null)} className="flex-1 bg-red-400 text-black border-4 border-black py-2 font-bold uppercase retro-btn cursor-pointer">BATAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}