import React, { useState, useEffect } from 'react';
import { expenseApi } from '../api/expenseApi';
import { groupApi } from '../api/groupApi';
import { useAuth } from '../context/AuthContext';
import ExpenseCard from '../components/cards/ExpenseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

import { Search, Filter, Receipt, ArrowUpDown } from 'lucide-react';

export const ExpenseHistoryPage = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('-expense_date');

  const [selectedExpense, setSelectedExpense] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [expRes, grpRes] = await Promise.all([
        expenseApi.getExpenses({
          search: search.trim(),
          group: selectedGroup,
          category: selectedCategory,
          sort: sortBy,
        }),
        groupApi.getGroups(),
      ]);

      const data = expRes.data.results || expRes.data;
      setExpenses(Array.isArray(data) ? data : []);

      const grpData = grpRes.data.results || grpRes.data;
      setGroups(Array.isArray(grpData) ? grpData : []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load expense history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedGroup, selectedCategory, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExpenses();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Expense History
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Search, filter, and audit expenses across all your active groups
        </p>
      </div>

      <ErrorMessage message={errorMsg} onRetry={fetchExpenses} />

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by title or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </form>

        {/* Group Filter */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:border-brand-500 focus:outline-none w-full sm:w-44"
        >
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:border-brand-500 focus:outline-none w-full sm:w-44"
        >
          <option value="">All Categories</option>
          <option value="food">Food & Dining</option>
          <option value="travel">Travel & Fuel</option>
          <option value="shopping">Shopping</option>
          <option value="entertainment">Entertainment</option>
          <option value="rent">Rent & Housing</option>
          <option value="utilities">Utilities & Bills</option>
          <option value="groceries">Groceries</option>
          <option value="hotel">Hotel</option>
          <option value="transport">Transport</option>
          <option value="medical">Medical</option>
          <option value="other">Other</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:border-brand-500 focus:outline-none w-full sm:w-44"
        >
          <option value="-expense_date">Newest Date</option>
          <option value="expense_date">Oldest Date</option>
          <option value="-amount">Highest Amount</option>
          <option value="amount">Lowest Amount</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading expense history..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description="Try clearing your search query or filters to see more results."
        />
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              currentUserId={user?.id}
              onClick={() => setSelectedExpense(exp)}
            />
          ))}
        </div>
      )}

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <Modal
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          title={selectedExpense.title}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Amount ({selectedExpense.group_name})
                </span>
                <span className="text-2xl font-black text-white">
                  ₹{parseFloat(selectedExpense.amount).toFixed(2)}
                </span>
              </div>
              <span className="px-3 py-1 bg-brand-500/20 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30 uppercase">
                {selectedExpense.split_method} SPLIT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="glass-card p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Paid by</span>
                <strong className="text-slate-100 text-sm font-bold">{selectedExpense.paid_by?.full_name}</strong>
              </div>
              <div className="glass-card p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Date</span>
                <strong className="text-slate-100 text-sm font-bold">{selectedExpense.expense_date}</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Participant Shares
              </h4>
              <div className="space-y-2">
                {selectedExpense.shares?.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-slate-200">{share.user?.full_name}</span>
                    <span className="font-black text-white">₹{parseFloat(share.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExpenseHistoryPage;
