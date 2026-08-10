import React, { useState, useEffect } from 'react';
import { groupApi } from '../api/groupApi';
import GroupCard from '../components/cards/GroupCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Plus, Search, Users } from 'lucide-react';

export const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await groupApi.getGroups();
      const data = res.data.results || res.data;
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await groupApi.createGroup({ name: name.trim(), description: description.trim() });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Expense Groups
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your active trip, apartment, and shared expense groups
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Group</span>
        </button>
      </div>

      <ErrorMessage message={errorMsg} onRetry={fetchGroups} />

      {/* Filter Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter groups by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <LoadingSpinner label="Loading groups..." />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups found"
          description={search ? 'No groups match your filter.' : 'Create your first group and start splitting expenses with friends.'}
          actionLabel="+ Create Group"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Group">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Goa Trip, Flat 402, College Friends"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Brief description of the group's shared expenses"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GroupsPage;
