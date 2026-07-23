"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { showToast } from '@/components/RetroToast';

// ----------------------------------------------------
// FUNGSI HELPER: KOMPRESI GAMBAR SECARA OTOMATIS (~50%)
// ----------------------------------------------------
const compressImage = (file: File, quality = 0.5, maxDimension = 1200): Promise<File> => {
  return new Promise((resolve) => {
    // Jika bukan file gambar, kembalikan file asli
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Kecilkan dimensi jika gambar terlalu besar (misal dari kamera HP 4K)
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Kompresi kualitas gambar (0.5 = 50%)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Buat File baru yang sudah terkompresi
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
};

export default function TransaksiPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [isLoading, setIsLoading] = useState(false);
  const [debts, setDebts] = useState<any[]>([]);
  const [recentTrx, setRecentTrx] = useState<any[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  const [type, setType] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('Makan');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: dData } = await supabase.from('debts').select('*').eq('status', 'belum_lunas').order('due_date');
    if (dData) {
      const sanitized = dData.map(d => ({
        ...d,
        amount: Number(d.amount) || 0,
        paid_amount: Number(d.paid_amount) || 0
      }));
      setDebts(sanitized);
    }

    const { data: tData } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(5);
    if (tData) setRecentTrx(tData);
  };

  useEffect(() => { fetchInitialData(); }, []);

  const handleTypeChange = (newType: 'pengeluaran' | 'pemasukan') => {
    setType(newType);
    setCategory(newType === 'pengeluaran' ? 'Makan' : 'Gaji');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val) val = parseInt(val, 10).toLocaleString('id-ID');
    setAmountStr(val);
  };

  const executeSubmit = async (force: boolean = false) => {
    const numericAmount = parseInt(amountStr.replace(/\./g, ''), 10);
    if (!numericAmount || numericAmount <= 0) {
      showToast("NOMINAL HARUS LEBIH DARI 0!", "error");
      return;
    }

    if (!force) {
      const isDup = recentTrx.some(t => Number(t.amount) === numericAmount && t.category === category && t.date === date);
      if (isDup) {
        setDuplicateWarning({ amount: numericAmount, category, date });
        return;
      }
    }

    setIsLoading(true);
    setDuplicateWarning(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak ditemukan.");

      let finalCategory = category;
      let debtId = null;
      let receiptUrl = null;

      // ----------------------------------------------------
      // PROSES UPLOAD & KOMPRESI STRUK OTOMATIS
      // ----------------------------------------------------
      if (receiptFile) {
        // 1. Kompres gambar sebelum diunggah ke Supabase
        const compressedFile = await compressImage(receiptFile, 0.5, 1200);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;

        // 2. Upload file terkompresi
        const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, compressedFile);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
          receiptUrl = publicUrlData.publicUrl;
        } else {
          console.warn("Upload gagal:", uploadError.message);
        }
      }

      if (category.startsWith('KASBON_')) {
        const dId = category.split('_')[1];
        const targetDebt = debts.find(d => d.id === dId);
        
        if (targetDebt) {
          finalCategory = `Bayar ${targetDebt.type === 'utang' ? 'Utang' : 'Piutang'}: ${targetDebt.person_name}`;
          debtId = dId;
          const currentPaid = Number(targetDebt.paid_amount) || 0;
          const totalAmt = Number(targetDebt.amount) || 0;
          const newPaidAmount = currentPaid + numericAmount;
          const isLunas = newPaidAmount >= totalAmt ? 'lunas' : 'belum_lunas';
          
          await supabase.from('debts').update({ paid_amount: newPaidAmount, status: isLunas }).eq('id', dId);
        }
      }

      const { error: trxErr } = await supabase.from('transactions').insert([{
        user_id: user.id, 
        type, 
        category: finalCategory, 
        payment_method: paymentMethod, 
        amount: numericAmount, 
        date, 
        notes, 
        debt_id: debtId, 
        receipt_url: receiptUrl
      }]);

      if (trxErr) throw trxErr;

      showToast("TRANSAKSI BERHASIL DISIMPAN! [OK]", "success");
      setAmountStr(''); 
      setNotes(''); 
      setReceiptFile(null);
      fetchInitialData();
    } catch (err: any) {
      showToast("GAGAL: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDebts = debts.filter(d => type === 'pengeluaran' ? d.type === 'utang' : d.type === 'piutang');

  return (
    <div className="min-h-screen p-6 md:p-12 text-black dark:text-white">
      <button type="button" onClick={() => router.push('/')} className="mb-8 retro-btn bg-black text-white dark:bg-white dark:text-black border-4 border-black px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
        {"< KEMBALI KE DASHBOARD"}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <div className="bg-white dark:bg-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-bold uppercase border-b-4 border-black pb-2 mb-6">INPUT TRANSAKSI</h2>
          
          <div className="flex gap-4 mb-6">
            <button type="button" onClick={() => handleTypeChange('pengeluaran')} className={`flex-1 border-4 border-black p-2 font-bold uppercase retro-btn cursor-pointer ${type === 'pengeluaran' ? 'bg-red-400 text-black' : 'bg-gray-200 text-gray-500'}`}>Pengeluaran (-)</button>
            <button type="button" onClick={() => handleTypeChange('pemasukan')} className={`flex-1 border-4 border-black p-2 font-bold uppercase retro-btn cursor-pointer ${type === 'pemasukan' ? 'bg-green-400 text-black' : 'bg-gray-200 text-gray-500'}`}>Pemasukan (+)</button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); executeSubmit(); }} className="flex flex-col gap-4">
            <div>
              <label className="font-bold uppercase mb-1 block text-sm">Nominal (Rp)</label>
              <input type="text" placeholder="Contoh: 50.000" value={amountStr} onChange={handleAmountChange} className="w-full border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 text-xl focus:outline-none" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold uppercase mb-1 block text-sm">Metode Pembayaran</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 focus:outline-none cursor-pointer">
                  <option value="Cash">CASH / TUNAI</option>
                  <option value="QRIS">QRIS / E-WALLET</option>
                  <option value="Transfer">TRANSFER BANK</option>
                </select>
              </div>
              <div>
                <label className="font-bold uppercase mb-1 block text-sm">Tanggal</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 focus:outline-none" required />
              </div>
            </div>

            <div>
              <label className="font-bold uppercase mb-1 block text-sm">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 focus:outline-none cursor-pointer">
                {type === 'pengeluaran' ? (
                  <>
                    <optgroup label="Pengeluaran Rutin">
                      <option value="Bensin">Bensin / Transportasi</option>
                      <option value="Makan">Makan & Minum</option>
                      <option value="Motor">Perawatan Motor</option>
                      <option value="Jajan">Jajan / Hiburan</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </optgroup>
                    {filteredDebts.length > 0 && (
                      <optgroup label="💰 BAYAR UTANG (Cicil Kasbon)">
                        {filteredDebts.map(d => {
                          const sisa = Math.max(0, (Number(d.amount) || 0) - (Number(d.paid_amount) || 0));
                          return (
                            <option key={d.id} value={`KASBON_${d.id}`}>
                              Bayar Utang ke {d.person_name} (Sisa Rp {sisa.toLocaleString('id-ID')})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </>
                ) : (
                  <>
                    <optgroup label="Pemasukan">
                      <option value="Gaji">Gaji Bulanan</option>
                      <option value="Bonus">Bonus / Lainnya</option>
                    </optgroup>
                    {filteredDebts.length > 0 && (
                      <optgroup label="💰 TERIMA PIUTANG (Tagih Kasbon)">
                        {filteredDebts.map(d => {
                          const sisa = Math.max(0, (Number(d.amount) || 0) - (Number(d.paid_amount) || 0));
                          return (
                            <option key={d.id} value={`KASBON_${d.id}`}>
                              Terima dari {d.person_name} (Sisa Rp {sisa.toLocaleString('id-ID')})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="font-bold uppercase mb-1 block text-sm">Catatan (Opsional)</label>
              <input type="text" placeholder="Keterangan..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border-4 border-black p-3 font-bold bg-white dark:bg-gray-800 focus:outline-none" />
            </div>

            <div>
              <label className="font-bold uppercase mb-1 block text-sm">Upload Foto Struk / Bukti (Auto-Compress 50%)</label>
              <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="w-full border-4 border-black p-2 font-bold bg-white dark:bg-gray-800 text-sm file:mr-4 file:py-1 file:px-4 file:border-2 file:border-black file:font-bold file:bg-yellow-300 file:text-black cursor-pointer" />
            </div>

            <button type="submit" disabled={isLoading} className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white border-4 border-black py-4 font-bold text-xl uppercase retro-btn cursor-pointer">
              {isLoading ? 'MENYIMPAN & MENGOMPRES...' : 'SIMPAN TRANSAKSI [OK]'}
            </button>
          </form>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-fit">
          <h2 className="text-xl font-bold uppercase border-b-4 border-black pb-2 mb-4">5 INPUT TERAKHIR</h2>
          <div className="flex flex-col gap-3">
            {recentTrx.length === 0 ? <p className="font-bold text-gray-500 uppercase text-sm">Belum ada transaksi.</p> : recentTrx.map(t => (
              <div key={t.id} className="bg-white dark:bg-black border-2 border-black p-3 flex justify-between items-center">
                <div>
                  <span className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black mr-2 ${t.type === 'pemasukan' ? 'bg-green-400 text-black' : 'bg-red-400 text-black'}`}>{t.payment_method || 'Cash'}</span>
                  <span className="font-bold uppercase text-sm">{t.category}</span>
                </div>
                <span className="font-bold">Rp {Number(t.amount || 0).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-yellow-400 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 text-black">
            <h2 className="text-2xl font-bold uppercase mb-2">⚠️ PERINGATAN GANDA!</h2>
            <p className="font-bold mb-6 text-sm">Transaksi sebesar <strong>Rp {duplicateWarning.amount.toLocaleString('id-ID')}</strong> untuk kategori <strong>{duplicateWarning.category}</strong> sudah tercatat. Yakin simpan lagi?</p>
            <div className="flex gap-4">
              <button onClick={() => executeSubmit(true)} className="flex-1 bg-green-400 border-4 border-black py-2 font-bold uppercase retro-btn cursor-pointer">Ya, Simpan</button>
              <button onClick={() => setDuplicateWarning(null)} className="flex-1 bg-red-400 border-4 border-black py-2 font-bold uppercase retro-btn cursor-pointer">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}