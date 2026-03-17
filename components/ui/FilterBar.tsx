'use client';

import { Filter, X } from 'lucide-react';
import clsx from 'clsx';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  className?: string;
}

export default function FilterBar({ filters, search, className }: FilterBarProps) {
  const hasActive = filters.some(f => f.value !== '') || (search && search.value !== '');

  return (
    <div className={clsx('flex items-center gap-2 flex-wrap', className)}>
      <Filter size={13} className="text-slate-500 flex-shrink-0" />
      {search && (
        <input
          type="text"
          placeholder={search.placeholder ?? 'Search...'}
          value={search.value}
          onChange={e => search.onChange(e.target.value)}
          className="bg-[#161b27] border border-slate-800 rounded-lg px-3 py-1.5 text-[12px] text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500/50 w-44"
        />
      )}
      {filters.map(filter => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={e => filter.onChange(e.target.value)}
          className="bg-[#161b27] border border-slate-800 rounded-lg px-3 py-1.5 text-[12px] text-slate-400 outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="">{filter.label}</option>
          {filter.options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {hasActive && (
        <button
          onClick={() => {
            filters.forEach(f => f.onChange(''));
            if (search) search.onChange('');
          }}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}
