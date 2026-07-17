"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useTransactionStore, Transaction } from '@/store/useTransactionStore';
import { supabase } from '@/lib/supabase'; // Pastikan path ini sesuai dengan file supabase Anda

export default function HistoryTable() {
  const { 
    transactions, setTransactions, removeTransaction, updateTransaction,
    searchQuery, setSearchQuery, 
    startDate, endDate, setDateRange, resetFilters 
  } = useTransactionStore();

  // State untuk mengontrol Modal Edit
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Mengambil data asli dari Supabase saat komponen dimuat
  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching data:', error);
      } else if (data) {
        setTransactions(data as Transaction[]);
      }
    };
    fetchTransactions();
  }, [setTransactions]);

  // --- LOGIKA HAPUS (DELETE) ---
  const handleDelete = async (id: string) => {
    // Dialog konfirmasi gaya retro
    if (!window.confirm("PERINGATAN: DATA AKAN DIHAPUS PERMANEN. LANJUTKAN? (Y/N)")) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update state lokal
      removeTransaction(id);
      alert("DATA BERHASIL DIHAPUS. [OK]");
    } catch (error: any) {
      alert("FATAL ERROR: " + error.message);
    }
  };

  // --- LOGIKA EDIT (UPDATE) ---
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          category: editingTrx.category,
          amount: editingTrx.amount,
          date: editingTrx.date,
          type: editingTrx.type,
          notes: editingTrx.notes,
        })
        .eq('id', editingTrx.id);

      if (error) throw error;

      // Update state lokal
      updateTransaction(editingTrx);
      setEditingTrx(null); // Tutup modal
      alert("DATA BERHASIL DIPERBARUI. [OK]");
    } catch (error: any) {
      alert("FATAL ERROR: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const matchSearch = trx.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          trx.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStartDate = startDate ? trx.date >= startDate : true;
      const matchEndDate = endDate ? trx.date <= endDate : true;
      return matchSearch && matchStartDate && matchEndDate;
    });
  }, [transactions, searchQuery, startDate, endDate]);

  return (
    <div className="relative mt-10">
      
      {/* Container Tabel Utama */}
      <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#4dff4d]">
        <div className="flex flex-col md:flex-row justify-between border-b-4 border-black pb-4 mb-6 gap-4">
          <h2 className="text-3xl font-bold uppercase dark:text-white bg-blue-300 dark:bg-blue-900 px-3 py-1 border-4 border-black">
            DATABASE HISTORI
          </h2>
          {/* ... (Kontrol Filter sama seperti sebelumnya) ... */}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            {/* ... (Thead sama seperti sebelumnya) ... */}
            <thead>
              <tr className="bg-black text-white dark:bg-white dark:text-black uppercase">
                <th className="py-3 px-4 border-4 border-black border-r-white dark:border-r-black">Tanggal</th>
                <th className="py-3 px-4 border-4 border-black border-r-white dark:border-r-black">Kategori</th>
                <th className="py-3 px-4 border-4 border-black border-r-white dark:border-r-black">Catatan</th>
                <th className="py-3 px-4 border-4 border-black text-right">Jumlah</th>
                <th className="py-3 px-4 border-4 border-black text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors dark:text-white">
                    <td className="py-3 px-4 border-x-4 border-b-4 border-black font-bold">{trx.date}</td>
                    <td className="py-3 px-4 border-x-4 border-b-4 border-black">{trx.category}</td>
                    <td className="py-3 px-4 border-x-4 border-b-4 border-black">{trx.notes || '-'}</td>
                    <td className={`py-3 px-4 border-x-4 border-b-4 border-black text-right font-bold ${trx.type === 'pemasukan' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {trx.type === 'pemasukan' ? '+' : '-'}Rp {trx.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 border-x-4 border-b-4 border-black text-center space-x-2">
                      <button 
                        onClick={() => setEditingTrx(trx)}
                        className="bg-blue-400 hover:bg-blue-500 text-black border-2 border-black px-2 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] retro-btn"
                        title="Edit Data"
                      >
                        EDIT
                      </button>
                      <button 
                        onClick={() => handleDelete(trx.id)}
                        className="bg-red-400 hover:bg-red-500 text-black border-2 border-black px-2 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] retro-btn"
                        title="Hapus Data"
                      >
                        DEL
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center border-4 border-t-0 border-black font-bold uppercase text-xl dark:text-white bg-gray-100 dark:bg-gray-900">
                    DATA KOSONG / TIDAK DITEMUKAN.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL EDIT RETRO --- */}
      {editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-gray-200 dark:bg-gray-800 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_#4dff4d]">
            
            {/* Modal Header */}
            <div className="bg-blue-700 dark:bg-blue-900 border-b-4 border-black p-2 flex justify-between items-center text-white">
              <h1 className="font-bold tracking-widest uppercase">EDIT_TRANSAKSI.EXE</h1>
              <button 
                onClick={() => setEditingTrx(null)}
                className="bg-gray-300 text-black border-2 border-black border-t-white border-l-white border-b-black border-r-black w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-gray-400 active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
              >
                X
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="font-bold uppercase dark:text-white">Kategori</label>
                <input 
                  type="text" 
                  value={editingTrx.category}
                  onChange={(e) => setEditingTrx({...editingTrx, category: e.target.value})}
                  className="border-4 border-black p-2 font-bold focus:bg-yellow-100 dark:focus:bg-purple-900 focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="font-bold uppercase dark:text-white">Jumlah (Rp)</label>
                <input 
                  type="number" 
                  value={editingTrx.amount}
                  onChange={(e) => setEditingTrx({...editingTrx, amount: Number(e.target.value)})}
                  className="border-4 border-black p-2 font-bold focus:bg-yellow-100 dark:focus:bg-purple-900 focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="font-bold uppercase dark:text-white">Tanggal</label>
                <input 
                  type="date" 
                  value={editingTrx.date}
                  onChange={(e) => setEditingTrx({...editingTrx, date: e.target.value})}
                  className="border-4 border-black p-2 font-bold focus:bg-yellow-100 dark:focus:bg-purple-900 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="flex-1 bg-green-400 hover:bg-green-500 text-black border-4 border-black py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] retro-btn disabled:opacity-50"
                >
                  {isUpdating ? 'MENYIMPAN...' : 'SIMPAN [OK]'}
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingTrx(null)}
                  className="flex-1 bg-red-400 hover:bg-red-500 text-black border-4 border-black py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] retro-btn"
                >
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