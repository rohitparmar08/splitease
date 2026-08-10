import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { Wallet, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (email) => {
    setIdentifier(email);
    setPassword('Password123');
  };

  return (
    <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl z-10">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-white">Welcome back to SplitEase</h2>
        <p className="text-xs text-slate-400 mt-1">Log in to manage your groups and balances</p>
      </div>

      <ErrorMessage message={errorMsg} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Email or Username
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="rahul@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 mt-2"
        >
          <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Accounts */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Demo Accounts (Password123)
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['rahul@example.com', 'amit@example.com', 'priya@example.com', 'mohit@example.com'].map((email) => (
            <button
              key={email}
              type="button"
              onClick={() => fillDemo(email)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              {email.split('@')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-400 font-bold hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
