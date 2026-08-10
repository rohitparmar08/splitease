import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const BalanceCard = ({ debt, currentUserId, onSettle }) => {
  const isIowe = debt.from_user?.id === currentUserId;
  const isOwedToMe = debt.to_user?.id === currentUserId;

  return (
    <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {/* Debtor Avatar */}
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700">
            {debt.from_user?.full_name?.charAt(0) || 'U'}
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          {/* Creditor Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 font-bold text-xs flex items-center justify-center border border-brand-500/30">
            {debt.to_user?.full_name?.charAt(0) || 'U'}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-200">
            <span className={isIowe ? 'text-rose-400 font-bold' : 'text-slate-300'}>
              {isIowe ? 'You' : debt.from_user?.full_name}
            </span>{' '}
            owes{' '}
            <span className={isOwedToMe ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
              {isOwedToMe ? 'you' : debt.to_user?.full_name}
            </span>
          </p>
          <p className="text-sm font-black text-white mt-0.5">₹{debt.amount}</p>
        </div>
      </div>

      {onSettle && (isIowe || isOwedToMe) && (
        <button
          onClick={() => onSettle(debt)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center space-x-1"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Settle Up</span>
        </button>
      )}
    </div>
  );
};

export default BalanceCard;
