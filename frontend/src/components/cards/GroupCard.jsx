import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowUpRight, Receipt } from 'lucide-react';

export const GroupCard = ({ group }) => {
  const net = parseFloat(group.user_net_balance || '0.00');
  const isPositive = net > 0;
  const isNegative = net < 0;

  return (
    <Link
      to={`/groups/${group.id}`}
      className="group glass-card rounded-2xl p-5 border border-slate-800 hover:border-brand-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 group-hover:text-brand-400 group-hover:bg-brand-500/10 flex items-center justify-center transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1 mb-1">
          {group.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {group.description || 'No description provided.'}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 text-slate-400 font-medium">
          <span className="flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{group.members_count}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>₹{group.total_expenses}</span>
          </span>
        </div>

        {/* User Net Balance Badge */}
        <div
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : isNegative
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isPositive && `+₹${net.toFixed(2)}`}
          {isNegative && `-₹${Math.abs(net).toFixed(2)}`}
          {net === 0 && 'Settled'}
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;
