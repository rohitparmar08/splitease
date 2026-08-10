import React from 'react';

export const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-[260px] w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
