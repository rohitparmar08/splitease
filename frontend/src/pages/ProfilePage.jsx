import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import ErrorMessage from '../components/ErrorMessage';
import { User, Mail, Lock, Check, Shield } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setIsUpdatingProfile(true);
    try {
      await updateProfile({ full_name: fullName.trim(), email: email.trim() });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      if (res.data.success) {
        setPassMsg({ type: 'success', text: 'Password changed successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to change password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your account information and security credentials
        </p>
      </div>

      {/* User Header Badge */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex items-center space-x-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-brand-500/25">
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
          <p className="text-xs text-slate-400">@{user?.username} • {user?.email}</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20 rounded-full">
            Active Account
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Edit Profile Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <User className="w-4 h-4 text-brand-400" />
            <span>Edit Profile</span>
          </h3>

          {profileMsg.text && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${profileMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-brand-400" />
            <span>Change Password</span>
          </h3>

          {passMsg.text && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${passMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isChangingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
