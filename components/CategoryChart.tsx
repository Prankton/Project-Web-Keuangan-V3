"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Data dummy (Nantinya diganti dengan data fetch dari Supabase)
const data = [
  { category: 'Makan', amount: 1500000 },
  { category: 'Transport', amount: 800000 },
  { category: 'Tagihan', amount: 1200000 },
  { category: 'Hiburan', amount: 500000 },
  { category: 'Belanja', amount: 950000 },
];

// Warna-warna terang (neon/pastel) untuk kontras retro
const COLORS = ['#4dff4d', '#ff4d4d', '#4d4dff', '#ffff4d', '#ff4dff'];

// Custom Tooltip bergaya Windows 95 / Brutalism
const RetroTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-black border-4 border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#4dff4d]">
        <p className="font-bold uppercase text-lg border-b-2 border-black pb-1 mb-2 dark:text-white">
          {label}
        </p>
        <p className="font-bold text-xl text-black dark:text-[#4dff4d]">
          Rp {payload[0].value.toLocaleString('id-ID')}
        </p>
      </div>
    );
  }
  return null;
};

export default function CategoryChart() {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#4dff4d]">
      <div className="flex justify-between items-end border-b-4 border-black pb-2 mb-6">
        <h2 className="text-2xl font-bold uppercase dark:text-white">Statistik Pengeluaran</h2>
        <span className="bg-black text-white dark:bg-white dark:text-black px-2 py-1 font-bold text-sm">
          JULI 2026
        </span>
      </div>

      <div className="h-80 w-full font-bold">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            {/* Grid putus-putus khas retro */}
            <CartesianGrid strokeDasharray="3 3" stroke="#000" className="dark:opacity-50" />
            
            <XAxis 
              dataKey="category" 
              stroke="#000" 
              tick={{ fill: 'currentColor', fontSize: 16 }}
              tickMargin={10}
            />
            <YAxis 
              stroke="#000" 
              tick={{ fill: 'currentColor', fontSize: 16 }} 
              tickFormatter={(value) => `Rp${value / 1000}k`}
            />
            
            <Tooltip content={<RetroTooltip />} cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
            
            {/* Bar dengan garis luar tebal (stroke) */}
            <Bar 
              dataKey="amount" 
              stroke="#000"       // Garis luar hitam
              strokeWidth={4}     // Ketebalan garis luar
              radius={[0, 0, 0, 0]} // Sudut tajam (tidak melengkung)
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}