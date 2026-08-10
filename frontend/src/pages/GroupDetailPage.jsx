import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupApi } from '../api/groupApi';
import { expenseApi } from '../api/expenseApi';
import { settlementApi } from '../api/settlementApi';
import { authApi } from '../api/authApi';

import ExpenseCard from '../components/cards/ExpenseCard';
import BalanceCard from '../components/cards/BalanceCard';
import ExpenseForm from '../components/forms/ExpenseForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

import {
  Users,
  Plus,
  Receipt,
  CheckCircle2,
  UserPlus,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  FileText,
  UserCheck
} from 'lucide-react';

export const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleData, setSettleData] = useState({ payer_id: '', receiver_id: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);
  const [settleError, setSettleError] = useState('');

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  const fetchGroupData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [groupRes, expRes, balRes, setRes] = await Promise.all([
        groupApi.getGroup(id),
        expenseApi.getGroupExpenses(id),
        groupApi.getGroupBalances(id),
        settlementApi.getGroupSettlements(id),
      ]);

      if (groupRes.data) setGroup(groupRes.data);
      if (expRes.data.expenses) setExpenses(expRes.data.expenses);
      if (balRes.data) setBalances(balRes.data);
      if (setRes.data.settlements) setSettlements(setRes.data.settlements);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  // Handle Add/Edit Expense
  const handleExpenseFormSubmit = async (payload) => {
    setIsSubmittingExpense(true);
    try {
      if (editingExpense) {
        await expenseApi.updateExpense(editingExpense.id, payload);
      } else {
        await expenseApi.createGroupExpense(id, payload);
      }
      setShowAddExpenseModal(false);
      setEditingExpense(null);
      fetchGroupData();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Handle Expense Delete
  const handleDeleteExpenseConfirm = async () => {
    if (!deletingExpenseId) return;
    try {
      await expenseApi.deleteExpense(deletingExpenseId);
      setDeletingExpenseId(null);
      setSelectedExpenseDetail(null);
      fetchGroupData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  // Open Settle Modal for a specific debt
  const openSettleModalForDebt = (debt) => {
    setSettleData({
      payer_id: debt.from_user?.id || '',
      receiver_id: debt.to_user?.id || '',
      amount: debt.amount || '',
      note: 'Debt settlement via SplitEase',
      date: new Date().toISOString().split('T')[0],
    });
    setSettleError('');
    setShowSettleModal(true);
  };

  // Handle Settle Form Submit
  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    setSettleError('');
    setIsSubmittingSettle(true);
    try {
      await settlementApi.createGroupSettlement(id, {
        payer_id: parseInt(settleData.payer_id, 10),
        receiver_id: parseInt(settleData.receiver_id, 10),
        amount: parseFloat(settleData.amount).toFixed(2),
        note: settleData.note,
        settlement_date: settleData.date,
      });
      setShowSettleModal(false);
      fetchGroupData();
    } catch (err) {
      setSettleError(err.response?.data?.message || err.message || 'Failed to record settlement.');
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  // User Search for Member Add
  const handleSearchUsers = async (query) => {
    setMemberIdentifier(query);
    if (query.trim().length >= 2) {
      try {
        const res = await authApi.searchUsers(query);
        setSearchResults(res.data.results || res.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddMemberSubmit = async (identifier) => {
    setIsAddingMember(true);
    try {
      await groupApi.addMember(id, { username_or_email: identifier });
      setShowAddMemberModal(false);
      setMemberIdentifier('');
      setSearchResults([]);
      fetchGroupData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId, fullName) => {
    if (window.confirm(`Are you sure you want to remove ${fullName} from this group?`)) {
      try {
        await groupApi.removeMember(id, userId);
        fetchGroupData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  if (loading) return <LoadingSpinner label="Loading group workspace..." />;
  if (errorMsg) return <ErrorMessage message={errorMsg} onRetry={fetchGroupData} />;
  if (!group) return null;

  const isAdmin = group.created_by?.id === currentUser?.id || group.members?.some(m => m.user.id === currentUser?.id && m.role === 'ADMIN');
  const userNet = parseFloat(group.user_net_balance || '0.00');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-brand-500/25 shrink-0">
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{group.name}</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {group.members?.length || 0} Members
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                {group.description || 'Shared expenses and balances for this group.'}
              </p>
              <div className="flex items-center space-x-4 text-xs text-slate-400 mt-3">
                <span>Total Spending: <strong className="text-white">₹{group.total_expenses}</strong></span>
                <span>Created by: <strong className="text-slate-200">{group.created_by?.full_name}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowAddExpenseModal(true);
              }}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Users },
          { id: 'expenses', label: `Expenses (${expenses.length})`, icon: Receipt },
          { id: 'balances', label: 'Balances & Debts', icon: CheckCircle2 },
          { id: 'members', label: `Members (${group.members?.length || 0})`, icon: Users },
          { id: 'settlements', label: `Settlements (${settlements.length})`, icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-600/90 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-3">Simplified Debt Transfers</h3>
              {balances?.simplified_debts?.length === 0 ? (
                <div className="glass-card rounded-2xl p-6 text-center border border-slate-800 text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  All debts in this group are completely settled!
                </div>
              ) : (
                <div className="space-y-3">
                  {balances?.simplified_debts?.map((debt, idx) => (
                    <BalanceCard
                      key={idx}
                      debt={debt}
                      currentUserId={currentUser?.id}
                      onSettle={openSettleModalForDebt}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-100">Recent Group Expenses</h3>
                <button onClick={() => setActiveTab('expenses')} className="text-xs text-brand-400 font-semibold hover:underline">
                  View all →
                </button>
              </div>

              <div className="space-y-3">
                {expenses.slice(0, 3).map((exp) => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    currentUserId={currentUser?.id}
                    onClick={() => setSelectedExpenseDetail(exp)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-100">Member Standings</h3>
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
              {balances?.member_balances?.map((mb) => {
                const net = parseFloat(mb.net_balance);
                return (
                  <div key={mb.user_id} className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-none">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center">
                        {mb.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          {mb.full_name} {mb.user_id === currentUser?.id ? '(You)' : ''}
                        </p>
                        <p className="text-[10px] text-slate-400">@{mb.username}</p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black ${
                        net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {net > 0 && `+₹${net.toFixed(2)}`}
                      {net < 0 && `-₹${Math.abs(net).toFixed(2)}`}
                      {net === 0 && '₹0.00'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100">All Expenses in {group.name}</h3>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowAddExpenseModal(true);
              }}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-500/20"
            >
              + Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses recorded yet"
              description="Click '+ Add Expense' to record shared dinners, travel, rent, or groceries."
              actionLabel="+ Add Expense"
              onAction={() => setShowAddExpenseModal(true)}
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => (
                <ExpenseCard
                  key={exp.id}
                  expense={exp}
                  currentUserId={currentUser?.id}
                  onClick={() => setSelectedExpenseDetail(exp)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BALANCES & DEBTS */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Simplified Peer-to-Peer Transfers</h3>
            <p className="text-xs text-slate-400 mb-4">
              Calculated using greedy minimum cash flow graph reduction to eliminate redundant intermediate transfers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {balances?.simplified_debts?.map((debt, idx) => (
                <BalanceCard
                  key={idx}
                  debt={debt}
                  currentUserId={currentUser?.id}
                  onSettle={openSettleModalForDebt}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100">Group Members ({group.members?.length})</h3>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-500/20 flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.members?.map((m) => (
              <div key={m.id} className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                    {m.user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">{m.user.full_name}</p>
                    <p className="text-xs text-slate-400">@{m.user.username}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${m.role === 'ADMIN' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    {m.role}
                  </span>
                  {isAdmin && m.user.id !== group.created_by.id && (
                    <button
                      onClick={() => handleRemoveMember(m.user.id, m.user.full_name)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SETTLEMENTS */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Settlement Audit History</h3>
          {settlements.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No settlements recorded yet"
              description="Settlement records provide an immutable audit trail when members pay off debts."
            />
          ) : (
            <div className="space-y-3">
              {settlements.map((s) => (
                <div key={s.id} className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">
                        {s.payer.full_name} paid {s.receiver.full_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.note || 'Debt settlement'} • {s.settlement_date}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-400">
                    ₹{parseFloat(s.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD/EDIT EXPENSE MODAL */}
      <Modal
        isOpen={showAddExpenseModal}
        onClose={() => {
          setShowAddExpenseModal(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
        maxWidth="max-w-2xl"
      >
        <ExpenseForm
          groupMembers={group.members || []}
          currentUserId={currentUser?.id}
          initialData={editingExpense}
          onSubmit={handleExpenseFormSubmit}
          onCancel={() => {
            setShowAddExpenseModal(false);
            setEditingExpense(null);
          }}
          isSubmitting={isSubmittingExpense}
        />
      </Modal>

      {/* SETTLE UP MODAL */}
      <Modal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        title="Settle Up Debt"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSettleSubmit} className="space-y-4">
          <ErrorMessage message={settleError} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Payer (Who pays)
            </label>
            <select
              value={settleData.payer_id}
              onChange={(e) => setSettleData({ ...settleData, payer_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
              required
            >
              <option value="">Select Payer</option>
              {group.members?.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Receiver (Who receives)
            </label>
            <select
              value={settleData.receiver_id}
              onChange={(e) => setSettleData({ ...settleData, receiver_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
              required
            >
              <option value="">Select Receiver</option>
              {group.members?.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Settlement Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={settleData.amount}
              onChange={(e) => setSettleData({ ...settleData, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 font-semibold focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Settlement Date
            </label>
            <input
              type="date"
              value={settleData.date}
              onChange={(e) => setSettleData({ ...settleData, date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GooglePay / Cash"
              value={settleData.note}
              onChange={(e) => setSettleData({ ...settleData, note: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowSettleModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingSettle}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmittingSettle ? 'Recording...' : 'Settle Debt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD MEMBER MODAL */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Member to Group"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Search Registered User by Username or Email
            </label>
            <input
              type="text"
              placeholder="e.g. amit@example.com or amit"
              value={memberIdentifier}
              onChange={(e) => handleSearchUsers(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-100">{u.full_name}</p>
                    <p className="text-[10px] text-slate-400">@{u.username} • {u.email}</p>
                  </div>
                  <button
                    onClick={() => handleAddMemberSubmit(u.email)}
                    disabled={isAddingMember}
                    className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => handleAddMemberSubmit(memberIdentifier)}
              disabled={isAddingMember || !memberIdentifier.trim()}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-50"
            >
              {isAddingMember ? 'Adding...' : 'Add to Group'}
            </button>
          </div>
        </div>
      </Modal>

      {/* EXPENSE DETAIL MODAL */}
      {selectedExpenseDetail && (
        <Modal
          isOpen={!!selectedExpenseDetail}
          onClose={() => setSelectedExpenseDetail(null)}
          title={selectedExpenseDetail.title}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Expense Amount
                </span>
                <span className="text-2xl font-black text-white">
                  ₹{parseFloat(selectedExpenseDetail.amount).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingExpense(selectedExpenseDetail);
                    setSelectedExpenseDetail(null);
                    setShowAddExpenseModal(true);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                  title="Edit Expense"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingExpenseId(selectedExpenseDetail.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors"
                  title="Delete Expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="glass-card p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Paid by</span>
                <strong className="text-slate-100 text-sm font-bold">{selectedExpenseDetail.paid_by?.full_name}</strong>
              </div>
              <div className="glass-card p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Split Method</span>
                <strong className="text-brand-300 text-sm font-bold">{selectedExpenseDetail.split_method}</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Participant Breakdown ({selectedExpenseDetail.shares?.length})
              </h4>
              <div className="space-y-2">
                {selectedExpenseDetail.shares?.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-slate-200">{share.user?.full_name}</span>
                    <span className="font-black text-white">₹{parseFloat(share.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedExpenseDetail.notes && (
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <strong className="block text-slate-400 mb-0.5">Notes:</strong>
                {selectedExpenseDetail.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={handleDeleteExpenseConfirm}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? All shares and balances will be recalculated automatically."
        confirmText="Delete Expense"
        isDanger={true}
      />
    </div>
  );
};

export default GroupDetailPage;
