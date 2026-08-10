import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Search, LogOut, User as UserIcon, Wallet, FileText, CheckCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/expenses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SplitEase
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full">
              Pro
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses, notes, groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* OpenAPI Docs Link */}
          <a
            href="http://127.0.0.1:8000/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 border border-slate-700 rounded-lg transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            <span>Swagger API</span>
          </a>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-100 text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-300 rounded-md">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAllRead}
                      className="text-xs text-brand-400 hover:underline flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          !n.is_read
                            ? 'bg-brand-500/10 border-brand-500/30 text-slate-100'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <p className="leading-relaxed font-medium">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-3 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-sm flex items-center justify-center shadow-md">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-200">
                {user?.full_name}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-100 truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-brand-400" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
