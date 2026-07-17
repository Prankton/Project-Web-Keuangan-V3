"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TransactionForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'pengeluaran',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0], // Default hari ini
    notes: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let receiptUrl = null;

      // 1. Upload Struk jika ada file yang dipilih
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile);

        if (uploadError) throw uploadError;

        // Ambil Public URL gambar yang baru diupload
        const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
        receiptUrl = data.publicUrl;
      }

      // 2. Insert Data Transaksi ke Database
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            type: formData.type,
            amount: parseFloat(formData.amount),
            category: formData.category,
            date: formData.date,
            notes: formData.notes,
            receipt_url: receiptUrl,
          }
        ]);

      if (insertError) throw insertError;

      alert("DATA TERSIMPAN! [OK]");
      // Reset form opsional di sini
      
    } catch (error: any) {
      alert("ERROR SYSTEM: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-black border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_#4dff4d] mt-10">
      <h2 className="text-3xl font-bold uppercase mb-6 border-b-4 border-black pb-2 text-center bg-yellow-300 dark:bg-purple-700 dark:text-white text-black p-2">
        INPUT TRANSAKSI BARU
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Tipe Transaksi */}
        <div className="flex flex-col">
          <label className="font-bold uppercase mb-1">Tipe Transaksi</label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={handleInputChange}
            className="border-4 border-black p-3 font-bold bg-gray-100 dark:bg-gray-800 focus:outline-none focus:bg-yellow-100 dark:focus:bg-purple-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d] transition-colors"
          >
            <option value="pengeluaran">PENGELUARAN (-)</option>
            <option value="pemasukan">PEMASUKAN (+)</option>
          </select>
        </div>

        {/* Jumlah */}
        <div className="flex flex-col">
          <label className="font-bold uppercase mb-1">Jumlah (Rp)</label>
          <input 
            type="number" 
            name="amount" 
            required 
            value={formData.amount} 
            onChange={handleInputChange}
            placeholder="0"
            className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 focus:outline-none focus:bg-yellow-100 dark:focus:bg-purple-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Kategori */}
          <div className="flex flex-col">
            <label className="font-bold uppercase mb-1">Kategori</label>
            <input 
              type="text" 
              name="category" 
              required 
              value={formData.category} 
              onChange={handleInputChange}
              placeholder="Cth: Makan, Gaji"
              className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 focus:outline-none focus:bg-yellow-100 dark:focus:bg-purple-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
            />
          </div>

          {/* Tanggal */}
          <div className="flex flex-col">
            <label className="font-bold uppercase mb-1">Tanggal</label>
            <input 
              type="date" 
              name="date" 
              required 
              value={formData.date} 
              onChange={handleInputChange}
              className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 focus:outline-none focus:bg-yellow-100 dark:focus:bg-purple-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
            />
          </div>
        </div>

        {/* Upload Struk (Brutalism File Input) */}
        <div className="flex flex-col mt-2">
          <label className="font-bold uppercase mb-1">Foto Struk (Opsional)</label>
          <div className="border-4 border-black border-dashed p-4 bg-blue-100 dark:bg-blue-900 text-center relative hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <p className="font-bold uppercase pointer-events-none">
              {receiptFile ? `[ ${receiptFile.name} ]` : "KLIK / DRAG FILE KE SINI"}
            </p>
          </div>
        </div>

        {/* Catatan */}
        <div className="flex flex-col">
          <label className="font-bold uppercase mb-1">Catatan Tambahan</label>
          <textarea 
            name="notes" 
            rows={3} 
            value={formData.notes} 
            onChange={handleInputChange}
            className="border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 focus:outline-none focus:bg-yellow-100 dark:focus:bg-purple-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#4dff4d]"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isLoading}
          className="mt-4 bg-green-500 hover:bg-green-400 text-black border-4 border-black p-4 font-bold text-xl uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] retro-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "MENYIMPAN DATA..." : "SIMPAN TRANSAKSI [ENTER]"}
        </button>
      </form>
    </div>
  );
}