import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Tv,
  Home,
  Zap,
  ShoppingCart,
  Hotel,
  HeartPulse,
  CreditCard,
  Calendar,
  User
} from 'lucide-react';

const categoryIcons = {
  food: Utensils,
  travel: Car,
  shopping: ShoppingBag,
  entertainment: Tv,
  rent: Home,
  utilities: Zap,
  groceries: ShoppingCart,
  hotel: Hotel,
  transport: Car,
  medical: HeartPulse,
  other: CreditCard,
};

export const ExpenseCard = ({ expense, currentUserId, onClick }) => {
  const Icon = categoryIcons[expense.category] || CreditCard;
  const userShareObj = expense.shares?.find((s) => s.user?.id === currentUserId);
  const userShareAmount = userShareObj ? parseFloat(userShareObj.amount) : 0;
  const isPaidByMe = expense.paid_by?.id === currentUserId;

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl p-4 border border-slate-800 hover:border-brand-500/40 transition-all cursor-pointer flex items-center justify-between group"
    >
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100 group-hover:text-brand-300 transition-colors">
            {expense.title}
          </h4>
          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center space-x-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>{isPaidByMe ? 'You paid' : `Paid by ${expense.paid_by?.full_name?.split(' ')[0]}`}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{expense.expense_date}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-black text-slate-100">
          ₹{parseFloat(expense.amount).toFixed(2)}
        </div>
        <div className="text-[11px] font-medium text-slate-400 mt-0.5">
          {userShareObj ? (
            <span className={isPaidByMe ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
              {isPaidByMe ? `You lent ₹${(parseFloat(expense.amount) - userShareAmount).toFixed(2)}` : `Your share: ₹${userShareAmount.toFixed(2)}`}
            </span>
          ) : (
            'Not participating'
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;
