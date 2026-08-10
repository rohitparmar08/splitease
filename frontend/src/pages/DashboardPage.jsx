import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../api/analyticsApi';
import { groupApi } from '../api/groupApi';
import DashboardCard from '../components/cards/DashboardCard';
import ExpenseCard from '../components/cards/ExpenseCard';
import GroupCard from '../components/cards/GroupCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Plus,
  ArrowRight,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Create Group Modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [analyticsRes, groupsRes] = await Promise.all([
        analyticsApi.getDashboardAnalytics(),
        groupApi.getGroups(),
      ]);
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data);
      }
      if (groupsRes.data.results) {
        setGroups(groupsRes.data.results);
      } else if (Array.isArray(groupsRes.data)) {
        setGroups(groupsRes.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      const res = await groupApi.createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
      });
      if (res.data.id || res.data.success) {
        const newGroup = res.data;
        setShowCreateGroupModal(false);
        setGroupName('');
        setGroupDescription('');
        fetchData();
        navigate(`/groups/${newGroup.id || newGroup.group?.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading dashboard & balances..." />;
  }

  const summary = analytics?.summary || {
    total_expenses: '0.00',
    you_owe: '0.00',
    you_are_owed: '0.00',
    net_balance: '0.00',
  };

  const netNum = parseFloat(summary.net_balance);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Financial Situation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Welcome back, {user?.full_name?.split(' ')[0]}. Here is your current balance summary.
          </p>
        </div>

        <button
          onClick={() => setShowCreateGroupModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      <ErrorMessage message={errorMsg} onRetry={fetchData} />

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardCard
          title="Total Expenses"
          amount={summary.total_expenses}
          subtitle="Group total spending"
          icon={Wallet}
          type="total"
        />
        <DashboardCard
          title="You Owe"
          amount={summary.you_owe}
          subtitle="Outstanding debts"
          icon={ArrowUpRight}
          type="owe"
        />
        <DashboardCard
          title="You Are Owed"
          amount={summary.you_are_owed}
          subtitle="Total receivable"
          icon={ArrowDownLeft}
          type="owed"
        />
        <DashboardCard
          title="Net Balance"
          amount={`${netNum >= 0 ? '+' : ''}${summary.net_balance}`}
          subtitle={netNum >= 0 ? 'Overall positive standing' : 'Overall negative standing'}
          icon={Scale}
          type="net"
        />
      </div>

      {/* Pending Settlements Banner */}
      {analytics?.pending_settlements?.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Pending Debt Settlements</span>
            </h3>
            <Link to="/groups" className="text-xs text-brand-400 hover:underline font-semibold">
              View all groups
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analytics.pending_settlements.map((ps, idx) => (
              <div
                key={idx}
                className="glass-card rounded-xl p-3.5 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    {ps.group_name}
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    {ps.type === 'YOU_OWE' ? (
                      <>You owe <strong className="text-rose-400">{ps.counterparty.full_name}</strong></>
                    ) : (
                      <><strong className="text-emerald-400">{ps.counterparty.full_name}</strong> owes you</>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-black ${ps.type === 'YOU_OWE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{ps.amount}
                  </span>
                  <Link
                    to={`/groups/${ps.group_id}`}
                    className="block text-[10px] font-bold text-brand-400 hover:underline mt-0.5"
                  >
                    Open Group →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Expenses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100">Recent Group Expenses</h3>
            <Link to="/expenses" className="text-xs font-semibold text-brand-400 hover:underline flex items-center space-x-1">
              <span>View History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {analytics?.recent_expenses?.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center border border-slate-800">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No expenses recorded yet.</p>
              </div>
            ) : (
              analytics?.recent_expenses?.map((exp) => (
                <ExpenseCard
                  key={exp.id}
                  expense={exp}
                  currentUserId={user?.id}
                  onClick={() => navigate(`/groups/${exp.group}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Your Groups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100">Your Groups ({groups.length})</h3>
            <Link to="/groups" className="text-xs font-semibold text-brand-400 hover:underline">
              See all
            </Link>
          </div>

          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center border border-slate-800">
                <p className="text-xs text-slate-400 mb-3">No groups created yet.</p>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  + Create First Group
                </button>
              </div>
            ) : (
              groups.slice(0, 4).map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <Modal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        title="Create New Expense Group"
      >
        <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Goa Trip, Flat 402, Office Lunch"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What is this group for?"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingGroup}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-50"
            >
              {isCreatingGroup ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
