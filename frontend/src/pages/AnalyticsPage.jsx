import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import ChartCard from '../components/cards/ChartCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#3b82f6'];

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await analyticsApi.getDashboardAnalytics();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner label="Compiling financial analytics..." />;
  if (errorMsg) return <ErrorMessage message={errorMsg} onRetry={fetchAnalytics} />;

  const categoryData = data?.category_spending?.map((item) => ({
    name: item.category.toUpperCase(),
    value: parseFloat(item.total),
  })) || [];

  const monthlyData = data?.monthly_spending?.map((item) => ({
    month: item.month,
    total: parseFloat(item.total),
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Financial Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Visual spending distributions and monthly trends powered strictly by database queries
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Spending Pie Chart */}
        <ChartCard
          title="Expenses by Category"
          subtitle="Proportional breakdown across all active groups"
        >
          {categoryData.length === 0 ? (
            <p className="text-xs text-slate-400">No expense category data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹${val.toFixed(2)}`, 'Spent']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Monthly Expenses Bar Chart */}
        <ChartCard
          title="Monthly Spending Trend"
          subtitle="Total spending volume grouped by month"
        >
          {monthlyData.length === 0 ? (
            <p className="text-xs text-slate-400">No monthly data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val) => [`₹${val.toFixed(2)}`, 'Total']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top Categories List */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-brand-400" />
          <span>Top Spending Categories</span>
        </h3>

        <div className="space-y-3">
          {categoryData.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="font-bold text-slate-200">{cat.name}</span>
              </div>
              <span className="font-black text-white">₹{cat.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
