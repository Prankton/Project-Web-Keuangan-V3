"use client";

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export type Transaction = {
  id: string;
  user_id?: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  date: string;
  notes?: string;
  receipt_url?: string;
};

export default function HistoryTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTransactions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
    } else if (data) {
      setTransactions(data as Transaction[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("PERINGATAN: DATA AKAN DIHAPUS PERMANEN. LANJUTKAN? (Y/N)")) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      alert("DATA BERHASIL DIHAPUS. [OK]");
      fetchTransactions();
    } catch (error: any) {
      alert("FATAL ERROR: " + error.message);
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
        })
        .eq('id', editingTrx.id);

      if (error) throw error;
      setEditingTrx(null);
      alert("DATA BERHASIL DIPERBARUI. [OK]");
      fetchTransactions();
    } catch (error: any) {
      alert("FATAL ERROR: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTransactions = transactions.filter((trx) => {
    const query = searchQuery.toLowerCase();
    const categoryMatch = trx.category ? trx.category.toLowerCase().includes(query) : false;
    const notesMatch = trx.notes ? trx.notes.toLowerCase().includes(query) : false;
    return categoryMatch || notesMatch;
  });

  return (
    <div className="relative mt-6">
      <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#4dff4d]">
        
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between border-b-4 border-black pb-4 mb-6 gap-4 items-center">
          <h2 className="text-2xl md:text-3xl font-bold uppercase dark:text-white bg-blue-300 dark:bg-blue-900 px-3 py-1 border-4 border-black">
            DATABASE HISTORI TRANSAKSI
          </h2>

          <input 
            type="text"
            placeholder="CARI KATEGORI / CATATAN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-4 border-black p-2 font-bold bg-gray-100 dark:bg-gray-800 text-black dark:text-white focus:outline-none w-full md:w-64"
          />
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center font-bold text-xl uppercase dark:text-white">
              MEMUAT DATABASE TRANSAKSI...
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-black text-white dark:bg-white dark:text-black uppercase">
                  <th className="py-3 px-4 border-4 border-black">Tanggal</th>
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
                    <tr key={trx.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">
                      <td className="py-3 px-4 border-x-4 border-b-4 border-black font-bold">{trx.date}</td>
                      <td className="py-3 px-4 border-x-4 border-b-4 border-black">{trx.category}</td>
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
                        <button onClick={() => setEditingTrx(trx)} className="bg-blue-400 hover:bg-blue-500 text-black border-2 border-black px-2 py-1 text-sm font-bold retro-btn">
                          EDIT
                        </button>
                        <button onClick={() => handleDelete(trx.id)} className="bg-red-400 hover:bg-red-500 text-black border-2 border-black px-2 py-1 text-sm font-bold retro-btn">
                          DEL
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center border-4 border-t-0 border-black font-bold uppercase text-xl text-black dark:text-white bg-gray-100 dark:bg-gray-900">
                      DATA KOSONG / TIDAK DITEMUKAN.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Edit */}
      {editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-gray-200 dark:bg-gray-800 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_#4dff4d]">
            <div className="bg-blue-700 dark:bg-blue-900 border-b-4 border-black p-2 flex justify-between items-center text-white">
              <h1 className="font-bold tracking-widest uppercase">EDIT_TRANSAKSI.EXE</h1>
              <button onClick={() => setEditingTrx(null)} className="bg-gray-300 text-black border-2 border-black font-bold w-6 h-6 flex items-center justify-center text-sm">
                X
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-4 text-black dark:text-white">
              <div className="flex flex-col">
                <label className="font-bold uppercase">Kategori</label>
                <input 
                  type="text" 
                  value={editingTrx.category}
                  onChange={(e) => setEditingTrx({...editingTrx, category: e.target.value})}
                  className="border-4 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="font-bold uppercase">Jumlah (Rp)</label>
                <input 
                  type="number" 
                  value={editingTrx.amount}
                  onChange={(e) => setEditingTrx({...editingTrx, amount: Number(e.target.value)})}
                  className="border-4 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="font-bold uppercase">Tanggal</label>
                <input 
                  type="date" 
                  value={editingTrx.date}
                  onChange={(e) => setEditingTrx({...editingTrx, date: e.target.value})}
                  className="border-4 border-black p-2 font-bold bg-white dark:bg-black focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-4 mt-4">
                <button type="submit" disabled={isUpdating} className="flex-1 bg-green-400 text-black border-4 border-black py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {isUpdating ? 'MENYIMPAN...' : 'SIMPAN [OK]'}
                </button>
                <button type="button" onClick={() => setEditingTrx(null)} className="flex-1 bg-red-400 text-black border-4 border-black py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  BATAL [ESC]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}