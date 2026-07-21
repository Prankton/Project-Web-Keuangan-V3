"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Debt = {
  id: string;
  type: 'utang' | 'piutang';
  person_name: string;
  amount: number;
  due_date: string;
  status: 'belum_lunas' | 'lunas';
  notes?: string;
};

export default function DebtManager() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({
    type: 'utang',
    person_name: '',
    amount: '',
    due_date: '',
    notes: '',
  });

  const fetchDebts = async () => {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (data && !error) setDebts(data as Debt[]);
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak ditemukan. Silakan login ulang.");

      const { error } = await supabase.from('debts').insert([{
        user_id: user.id,
        type: formData.type,
        person_name: formData.person_name,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        notes: formData.notes,
        status: 'belum_lunas'
      }]);
      
      if (error) throw error;
      
      alert("DATA KASBON TERCATAT! [OK]");
      setFormData({ type: 'utang', person_name: '', amount: '', due_date: '', notes: '' });
      fetchDebts();
    } catch (error: any) {
      alert("ERROR: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async (id: string) => {
    if (!window.confirm("TANDAI SEBAGAI LUNAS?")) return;
    
    const { error } = await supabase
      .from('debts')
      .update({ status: 'lunas' })
      .eq('id', id);
      
    if (!error) fetchDebts();
  };

  const utangList = debts.filter(d => d.type === 'utang');
  const piutangList = debts.filter(d => d.type === 'piutang');

  return (
    <div className="mt-10">
      <h2 className="text-3xl md:text-4xl font-bold uppercase mb-8 border-b-4 border-black pb-2 dark:text-white">
        SISTEM BUKU KASBON (UTANG & PIUTANG)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- FORM INPUT --- */}
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d] lg:col-span-1 h-fit">
          <h3 className="text-xl font-bold uppercase mb-4 bg-yellow-300 dark:bg-purple-700 text-black dark:text-white p-2 border-4 border-black">
            + ENTRI KASBON BARU
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-black dark:text-white">
            
            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1">Jenis Kasbon</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as 'utang' | 'piutang'})}
                className="border-4 border-black p-2 font-bold bg-gray-100 dark:bg-gray-800 text-black dark:text-white focus:outline-none"
              >
                <option value="utang">SAYA BERUTANG (UTANG)</option>
                <option value="piutang">ORANG BERUTANG (PIUTANG)</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1">Nama Pihak Terkait</label>
              <input 
                type="text" required
                value={formData.person_name}
                onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                placeholder="Cth: Budi"
                className="border-4 border-black p-2 font-bold bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1">Jumlah (Rp)</label>
              <input 
                type="number" required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0"
                className="border-4 border-black p-2 font-bold bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold uppercase mb-1">Jatuh Tempo</label>
              <input 
                type="date" required
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="border-4 border-black p-2 font-bold bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none"
              />
            </div>

            <button 
              type="submit" disabled={isLoading}
              className="mt-2 bg-blue-400 hover:bg-blue-500 text-black border-4 border-black p-3 font-bold text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] retro-btn disabled:opacity-50"
            >
              {isLoading ? 'MENYIMPAN...' : 'SIMPAN DATA'}
            </button>
          </form>
        </div>

        {/* --- DAFTAR KASBON --- */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Kolom Utang */}
          <div className="bg-red-100 dark:bg-red-950 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
            <h3 className="text-xl font-bold uppercase mb-4 text-white bg-red-600 p-2 border-4 border-black text-center">
              UTANG SAYA (-)
            </h3>
            <div className="flex flex-col gap-4">
              {utangList.length === 0 ? <p className="font-bold uppercase dark:text-white text-center py-4">TIDAK ADA UTANG [OK]</p> : utangList.map(item => (
                <div key={item.id} className={`border-4 border-black p-4 ${item.status === 'lunas' ? 'bg-gray-300 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-black dark:text-white'}`}>
                  <div className="flex justify-between items-start mb-2 border-b-2 border-black border-dashed pb-2">
                    <span className="font-bold text-lg">{item.person_name}</span>
                    <span className="font-bold text-red-600 dark:text-red-400">Rp {item.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-sm font-bold mb-3">Tempo: {item.due_date}</div>
                  
                  {item.status === 'belum_lunas' ? (
                    <button onClick={() => markAsPaid(item.id)} className="w-full bg-black text-white dark:bg-white dark:text-black border-2 border-black p-1 font-bold uppercase retro-btn text-sm">
                      Tandai Lunas
                    </button>
                  ) : (
                    <div className="text-center w-full bg-green-400 text-black border-2 border-black p-1 font-bold uppercase text-sm">
                      LUNAS [OK]
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kolom Piutang */}
          <div className="bg-green-100 dark:bg-green-950 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
            <h3 className="text-xl font-bold uppercase mb-4 text-white bg-green-600 p-2 border-4 border-black text-center">
              PIUTANG SAYA (+)
            </h3>
            <div className="flex flex-col gap-4">
              {piutangList.length === 0 ? <p className="font-bold uppercase dark:text-white text-center py-4">TIDAK ADA PIUTANG [OK]</p> : piutangList.map(item => (
                <div key={item.id} className={`border-4 border-black p-4 ${item.status === 'lunas' ? 'bg-gray-300 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-black dark:text-white'}`}>
                  <div className="flex justify-between items-start mb-2 border-b-2 border-black border-dashed pb-2">
                    <span className="font-bold text-lg">{item.person_name}</span>
                    <span className="font-bold text-green-600 dark:text-green-400">Rp {item.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-sm font-bold mb-3">Tempo: {item.due_date}</div>
                  
                  {item.status === 'belum_lunas' ? (
                    <button onClick={() => markAsPaid(item.id)} className="w-full bg-black text-white dark:bg-white dark:text-black border-2 border-black p-1 font-bold uppercase retro-btn text-sm">
                      Tandai Dibayar
                    </button>
                  ) : (
                    <div className="text-center w-full bg-green-400 text-black border-2 border-black p-1 font-bold uppercase text-sm">
                      DIBAYAR [OK]
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}