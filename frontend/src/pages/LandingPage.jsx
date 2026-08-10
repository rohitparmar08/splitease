import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ShieldCheck, Zap, ArrowRight, PieChart, Users, CheckCircle2, ChevronRight } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SplitEase
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-28 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Automated Graph Debt Simplification & Decimal Precision</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
          Split expenses.{' '}
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Stay even.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Track shared expenses, simplify multi-party debts, and settle up with roommates, trips, and friends — without spreadsheet headaches.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand-500/25 flex items-center justify-center space-x-2 text-base active:scale-95"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold rounded-2xl transition-all text-base"
          >
            Explore Demo Account
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white mb-3">Designed for modern groups</h2>
          <p className="text-slate-400 text-sm">
            Powered by a centralized Django balance calculation engine and PostgreSQL transaction safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">4 Flexible Split Methods</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Support Equal, Exact amounts, Percentages (100%), and Shares splits with exact penny discrepancy handling.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Smart Debt Simplification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Greedy minimum cash-flow reduction algorithm collapses transitive debts so groups transfer cash fewer times.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Real Financial Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive Recharts breakdown for categories, monthly trends, and group spending metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-8 mt-20 text-center text-xs text-slate-500">
        <p>© 2026 SplitEase Inc. Production-Ready Expense Management Platform.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
