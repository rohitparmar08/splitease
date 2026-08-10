import React from 'react';

export const SplitSelector = ({
  splitMethod,
  setSplitMethod,
  amount,
  groupMembers = [],
  participantInputs,
  setParticipantInputs,
}) => {
  const totalAmount = parseFloat(amount || '0');

  const handleToggleParticipant = (userId) => {
    const exists = participantInputs.some((p) => p.user_id === userId);
    if (exists) {
      if (participantInputs.length <= 1) return; // Must have at least 1 participant
      setParticipantInputs(participantInputs.filter((p) => p.user_id !== userId));
    } else {
      setParticipantInputs([...participantInputs, { user_id: userId, amount: '', percentage: '', shares: '1' }]);
    }
  };

  const handleInputChange = (userId, field, value) => {
    setParticipantInputs(
      participantInputs.map((p) => (p.user_id === userId ? { ...p, [field]: value } : p))
    );
  };

  // Real-time checks
  const exactSum = participantInputs.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pctSum = participantInputs.reduce((sum, p) => sum + (parseFloat(p.percentage) || 0), 0);
  const sharesSum = participantInputs.reduce((sum, p) => sum + (parseFloat(p.shares) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Split Method Tabs */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Split Method
        </label>
        <div className="grid grid-cols-4 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'EQUAL', label: 'Equal (=)' },
            { id: 'EXACT', label: 'Exact (₹)' },
            { id: 'PERCENTAGE', label: 'Percent (%)' },
            { id: 'SHARES', label: 'Shares (x)' },
          ].map((method) => (
            <button
              type="button"
              key={method.id}
              onClick={() => setSplitMethod(method.id)}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                splitMethod === method.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

      {/* Participant List Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Participants ({participantInputs.length})
          </label>

          {/* Validation Feedback Badges */}
          {splitMethod === 'EXACT' && totalAmount > 0 && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                Math.abs(exactSum - totalAmount) < 0.01
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              Sum: ₹{exactSum.toFixed(2)} / ₹{totalAmount.toFixed(2)}
            </span>
          )}

          {splitMethod === 'PERCENTAGE' && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                Math.abs(pctSum - 100) < 0.01
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              Total: {pctSum.toFixed(1)}% / 100%
            </span>
          )}

          {splitMethod === 'SHARES' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300">
              Total Shares: {sharesSum}
            </span>
          )}
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {groupMembers.map((member) => {
            const isSelected = participantInputs.some((p) => p.user_id === member.user.id);
            const inputVal = participantInputs.find((p) => p.user_id === member.user.id) || {};

            return (
              <div
                key={member.user.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-slate-900/90 border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleParticipant(member.user.id)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    {member.user.full_name}
                  </span>
                </div>

                {isSelected && (
                  <div className="w-32">
                    {splitMethod === 'EQUAL' && (
                      <span className="text-xs font-bold text-slate-400 block text-right">
                        ₹
                        {totalAmount > 0 && participantInputs.length > 0
                          ? (totalAmount / participantInputs.length).toFixed(2)
                          : '0.00'}
                      </span>
                    )}

                    {splitMethod === 'EXACT' && (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={inputVal.amount || ''}
                          onChange={(e) => handleInputChange(member.user.id, 'amount', e.target.value)}
                          className="w-full pl-6 pr-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-brand-500 focus:outline-none text-right"
                        />
                      </div>
                    )}

                    {splitMethod === 'PERCENTAGE' && (
                      <div className="relative">
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={inputVal.percentage || ''}
                          onChange={(e) => handleInputChange(member.user.id, 'percentage', e.target.value)}
                          className="w-full pl-2 pr-6 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-brand-500 focus:outline-none text-right"
                        />
                      </div>
                    )}

                    {splitMethod === 'SHARES' && (
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="1"
                          value={inputVal.shares || '1'}
                          onChange={(e) => handleInputChange(member.user.id, 'shares', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-brand-500 focus:outline-none text-right"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SplitSelector;
