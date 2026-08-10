import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        The page or group workspace you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-brand-500/20 flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
