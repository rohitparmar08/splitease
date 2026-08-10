import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="glass-card rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8 border border-slate-800">
      <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
