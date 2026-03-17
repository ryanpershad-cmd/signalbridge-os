'use client';

import { Bell, Search } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="h-12 bg-[#0d1117] border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 w-64">
        <Search size={13} className="text-slate-500" />
        <input
          type="text"
          placeholder="Search companies, initiatives..."
          className="bg-transparent text-[12px] text-slate-400 placeholder-slate-600 outline-none w-full"
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-slate-500 font-mono">As of Dec 9, 2024</span>
        <button className="relative p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
          <Bell size={15} className="text-slate-400" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-medium text-white">
          EC
        </div>
      </div>
    </header>
  );
}
