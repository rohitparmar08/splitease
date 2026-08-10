import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  PieChart,
  User,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'Expense Groups', icon: Users },
    { to: '/expenses', label: 'Expense History', icon: Receipt },
    { to: '/analytics', label: 'Analytics', icon: PieChart },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-800/80 min-h-[calc(100vh-65px)] p-4 space-y-6">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Menu Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600/90 text-white shadow-lg shadow-brand-500/25 border border-brand-500/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800/80 space-y-3">
        <div className="glass-card rounded-xl p-3.5 border border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>PostgreSQL Verified</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Financial calculations & debt simplification powered strictly by Django backend services.
          </p>
        </div>

        <a
          href="http://127.0.0.1:8000/api/docs/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 rounded-xl transition-all"
        >
          <span>Swagger API Specs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
