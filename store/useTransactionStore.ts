import { create } from 'zustand';

export type Transaction = {
  id: string;
  date: string;
  category: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  notes: string;
};

interface TransactionState {
  transactions: Transaction[];
  searchQuery: string;
  startDate: string;
  endDate: string;
  
  setTransactions: (data: Transaction[]) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (updatedData: Transaction) => void;
  
  setSearchQuery: (query: string) => void;
  setDateRange: (start: string, end: string) => void;
  resetFilters: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  searchQuery: '',
  startDate: '',
  endDate: '',

  setTransactions: (data) => set({ transactions: data }),
  
  // Hapus data dari state lokal
  removeTransaction: (id) => set((state) => ({ 
    transactions: state.transactions.filter((trx) => trx.id !== id) 
  })),
  
  // Perbarui data di state lokal
  updateTransaction: (updatedData) => set((state) => ({
    transactions: state.transactions.map((trx) => 
      trx.id === updatedData.id ? updatedData : trx
    )
  })),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setDateRange: (start, end) => set({ startDate: start, endDate: end }),
  resetFilters: () => set({ searchQuery: '', startDate: '', endDate: '' }),
}));