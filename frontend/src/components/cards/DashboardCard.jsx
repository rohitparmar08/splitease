import React from 'react';

export const DashboardCard = ({ title, amount, subtitle, icon: Icon, type = 'neutral' }) => {
  const typeStyles = {
    total: 'border-brand-500/30 bg-gradient-to-br from-brand-950/40 to-slate-900/80 text-brand-300',
    owe: 'border-rose-500/30 bg-gradient-to-br from-rose-950/30 to-slate-900/80 text-rose-400',
    owed: 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-900/80 text-emerald-400',
    net: 'border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/80 text-indigo-300',
  };

  const iconBg = {
    total: 'bg-brand-500/20 text-brand-400',
    owe: 'bg-rose-500/20 text-rose-400',
    owed: 'bg-emerald-500/20 text-emerald-400',
    net: 'bg-indigo-500/20 text-indigo-400',
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 border shadow-xl transition-all duration-300 hover:-translate-y-1 ${typeStyles[type] || typeStyles.total}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[type] || iconBg.total}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
        ₹{amount}
      </div>
      {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
    </div>
  );
};

export default DashboardCard;
