'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Layers, AlertTriangle, Calendar } from 'lucide-react';
import clsx from 'clsx';

const companies = [
  { name: 'Northstar Foods', slug: 'northstar-foods', color: '#22c55e' },
  { name: 'BluePeak Software', slug: 'bluepeak-software', color: '#3b82f6' },
  { name: 'Vertex Logistics', slug: 'vertex-logistics', color: '#f59e0b' },
  { name: 'Harbor Home Services', slug: 'harbor-home-services', color: '#f97316' },
  { name: 'Apex Health', slug: 'apex-health', color: '#ef4444' },
];

const navItems = [
  { label: 'Portfolio', icon: LayoutGrid, href: '/' },
  { label: 'Initiatives', icon: Layers, href: '/initiatives' },
  { label: 'Risks & Blockers', icon: AlertTriangle, href: '/risks' },
  { label: 'Operating Cadence', icon: Calendar, href: '/cadence' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[#0d1117] border-r border-slate-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">E</span>
          </div>
          <span className="text-slate-100 font-semibold text-[13px] tracking-widest uppercase">
            SignalBridge OS
          </span>
        </div>
        <p className="text-slate-500 text-[11px] ml-8">By Merrin Investors</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-3 mb-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-[13px] transition-colors',
                  active
                    ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 pl-[10px]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Icon size={15} className="flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="px-3 mt-4">
          <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-slate-600 font-medium">
            Portfolio Companies
          </p>
          {companies.map(company => {
            const href = `/company/${company.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={company.slug}
                href={href}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-[12px] transition-colors',
                  active
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: company.color }}
                />
                <span className="truncate">{company.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center">Q4 2024 · Demo Mode</p>
      </div>
    </aside>
  );
}
