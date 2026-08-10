import React, { useState, useEffect } from 'react';
import SplitSelector from './SplitSelector';
import ErrorMessage from '../ErrorMessage';

export const ExpenseForm = ({
  groupMembers = [],
  currentUserId,
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [paidById, setPaidById] = useState(initialData?.paid_by?.id || currentUserId);
  const [category, setCategory] = useState(initialData?.category || 'food');
  const [splitMethod, setSplitMethod] = useState(initialData?.split_method || 'EQUAL');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expense_date || new Date().toISOString().split('T')[0]
  );
  const [errorMsg, setErrorMsg] = useState('');

  // Initial participant list
  const [participantInputs, setParticipantInputs] = useState(() => {
    if (initialData?.shares && initialData.shares.length > 0) {
      return initialData.shares.map((s) => ({
        user_id: s.user.id,
        amount: s.amount || '',
        percentage: s.percentage || '',
        shares: s.shares || '1',
      }));
    }
    return groupMembers.map((m) => ({
      user_id: m.user.id,
      amount: '',
      percentage: '',
      shares: '1',
    }));
  });

  useEffect(() => {
    if (groupMembers.length > 0 && participantInputs.length === 0) {
      setParticipantInputs(
        groupMembers.map((m) => ({
          user_id: m.user.id,
          amount: '',
          percentage: '',
          shares: '1',
        }))
      );
    }
  }, [groupMembers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setErrorMsg('Expense title is required.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (participantInputs.length === 0) {
      setErrorMsg('Please select at least one participant.');
      return;
    }

    const payload = {
      title: title.trim(),
      amount: parsedAmount.toFixed(2),
      paid_by_id: parseInt(paidById, 10),
      category,
      split_method: splitMethod,
      notes: notes.trim(),
      expense_date: expenseDate,
      participants: participantInputs.map((p) => ({
        user_id: p.user_id,
        amount: p.amount ? parseFloat(p.amount).toFixed(2) : null,
        percentage: p.percentage ? parseFloat(p.percentage).toFixed(2) : null,
        shares: p.shares ? parseFloat(p.shares).toFixed(2) : null,
      })),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save expense.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={errorMsg} />

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Expense Title
        </label>
        <input
          type="text"
          placeholder="e.g. Dinner, Villa Rent, Grocery shopping"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-semibold text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Paid By
          </label>
          <select
            value={paidById}
            onChange={(e) => setPaidById(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
          >
            {groupMembers.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.full_name} {m.user.id === currentUserId ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
          >
            <option value="food">Food & Dining</option>
            <option value="travel">Travel & Fuel</option>
            <option value="shopping">Shopping</option>
            <option value="entertainment">Entertainment</option>
            <option value="rent">Rent & Housing</option>
            <option value="utilities">Utilities & Bills</option>
            <option value="groceries">Groceries</option>
            <option value="hotel">Hotel & Accommodation</option>
            <option value="transport">Transport</option>
            <option value="medical">Medical</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Expense Date
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <SplitSelector
        splitMethod={splitMethod}
        setSplitMethod={setSplitMethod}
        amount={amount}
        groupMembers={groupMembers}
        participantInputs={participantInputs}
        setParticipantInputs={setParticipantInputs}
      />

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Notes (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="Add additional details or notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none resize-none"
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving Expense...' : initialData ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
