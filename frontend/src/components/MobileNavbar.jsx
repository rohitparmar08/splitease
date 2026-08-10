import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, PieChart, User } from 'lucide-react';

export const MobileNavbar = () => {
  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'Groups', icon: Users },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/analytics', label: 'Analytics', icon: PieChart },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800 px-2 py-2 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-brand-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNavbar;
