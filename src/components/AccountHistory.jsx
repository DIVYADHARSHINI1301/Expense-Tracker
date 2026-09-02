import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, X, Calendar, Trash2, Wallet, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounts } from '../context/AccountsContext';
import { acctGetIncome, acctGetExpenses, acctDeleteIncome, acctDeleteExpense } from '../firebase/accountFirestore';
import { calculateRunningBalances, formatDateTime, formatDateDDMMYYYY } from '../utils/dateUtils';
import CategoryIcon from './CategoryIcons';
import EditTransactionModal from './EditTransactionModal';
import GlowLoader from './GlowLoader';
import toast from 'react-hot-toast';

export default function AccountHistory({ onUpdate }) {
  const { accountId } = useParams();
  const { currentUser } = useAuth();
  const { accounts } = useAccounts();
  const navigate = useNavigate();

  const account = accounts.find(a => a.id === accountId);
  const accent  = account?.accent || '#4a9eff';

  const [all, setAll]               = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingTx, setEditingTx]   = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!currentUser || !accountId) return;
    setLoading(true);
    try {
      const [inc, exp] = await Promise.all([
        acctGetIncome(currentUser.uid, accountId),
        acctGetExpenses(currentUser.uid, accountId),
      ]);

      const merged = [
        ...exp.map(e => ({ ...e, txType: 'expense' })),
        ...inc.map(i => ({ ...i, txType: 'income' })),
      ];

      // Calculate chronological running balance for every transaction
      const withBalances = calculateRunningBalances(merged);

      // Sort newest first for display
      withBalances.sort((a, b) => new Date(b.date) - new Date(a.date));

      setAll(withBalances);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, accountId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (tx) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      if (tx.txType === 'income') {
        await acctDeleteIncome(currentUser.uid, accountId, tx.id);
      } else {
        await acctDeleteExpense(currentUser.uid, accountId, tx.id);
      }
      toast.success('Deleted');
      fetchTransactions();
      onUpdate?.();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <GlowLoader label="Loading history..." />;

  const filtered = all.filter(t => {
    const matchSearch = !search || (t.title || t.source || t.category || '').toLowerCase().includes(search.toLowerCase());
    const matchDate   = !dateFilter || t.date?.startsWith(dateFilter);
    const matchType   = typeFilter === 'all' || t.txType === typeFilter;
    return matchSearch && matchDate && matchType;
  });

  const totalIncome   = all.filter(t => t.txType === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpenses = all.filter(t => t.txType === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const currentTotalBal = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117] flex flex-col">
      {/* Header - STICKY */}
      <div
        className="sticky top-0 z-40 px-4 pt-5 pb-4 shadow-lg transition-shadow duration-300"
        style={{ background: `linear-gradient(135deg, ${accent}ee, ${accent}99)` }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/account/${accountId}`)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-white text-base font-bold">Transaction History</h1>
            <p className="text-white/70 text-xs">{account?.name || 'Account'}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 space-y-3 pb-32">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className="rounded-xl p-2.5 flex flex-col justify-between"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
            >
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: accent }} />
                <p className="text-[#8a9bb0] text-[9px] uppercase tracking-wider font-semibold">Income</p>
              </div>
              <p className="text-gray-900 dark:text-white text-xs font-black">₹{totalIncome.toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-white dark:bg-[#1a2332] rounded-xl p-2.5 flex flex-col justify-between border border-gray-100 dark:border-[#1e2a38]">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-[#f87171]" />
                <p className="text-[#8a9bb0] text-[9px] uppercase tracking-wider font-semibold">Spent</p>
              </div>
              <p className="text-gray-900 dark:text-white text-xs font-black">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-white dark:bg-[#1a2332] rounded-xl p-2.5 flex flex-col justify-between border border-gray-100 dark:border-[#1e2a38]">
              <div className="flex items-center gap-1 mb-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-[#8a9bb0] text-[9px] uppercase tracking-wider font-semibold">Net Bal</p>
              </div>
              <p className={`text-xs font-black ${currentTotalBal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ₹{currentTotalBal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-gray-100 dark:border-[#1e2a38] p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search by title, source, category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#1a2332] border border-gray-200 dark:border-[#1e2a38] text-gray-800 dark:text-[#c8d8e8] focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 active:scale-90 transition-transform"
                >
                  <X className="w-3.5 h-3.5 text-[#8a9bb0]" />
                </button>
              )}
            </div>

            <div className="flex gap-2 items-center">
              {/* Date Filter in DD/MM/YYYY format */}
              <div className="relative flex-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1a2332] border border-gray-200 dark:border-[#1e2a38]">
                  <Calendar className="w-3.5 h-3.5 text-[#8a9bb0] flex-shrink-0" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="w-full bg-transparent text-[11px] text-gray-800 dark:text-[#c8d8e8] focus:outline-none cursor-pointer"
                  />
                  {dateFilter && (
                    <button onClick={() => setDateFilter('')} className="text-[#8a9bb0] hover:text-gray-700">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Type Filter Buttons */}
              <div className="flex gap-1">
                {['all', 'income', 'expense'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                    style={
                      typeFilter === t
                        ? { backgroundColor: accent, color: '#fff' }
                        : { background: 'transparent', color: '#8a9bb0', border: '1px solid #e2e8f0' }
                    }
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction list */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-[#161d27] rounded-xl p-8 text-center border border-gray-100 dark:border-[#1e2a38]">
                <p className="text-sm font-semibold text-[#6b7a8d]">No transactions found</p>
                <p className="text-xs text-[#8a9bb0] mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filtered.map((t, i) => (
                <div
                  key={t.id || i}
                  className="bg-white dark:bg-[#161d27] rounded-xl overflow-hidden animate-card-in border border-[#e8ecf0] dark:border-[#1e2a38] transition-all hover:border-[#cbd5e1] dark:hover:border-[#334155]"
                  style={{ animationDelay: `${Math.min(i, 8) * 0.03}s` }}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: t.txType === 'income' ? `${accent}18` : 'rgba(248,113,113,0.1)' }}
                    >
                      {t.txType === 'expense' ? (
                        <CategoryIcon category={t.category} className="w-4 h-4 text-[#f87171]" />
                      ) : (
                        <Wallet className="w-4 h-4" style={{ color: accent }} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-800 dark:text-[#c8d8e8] truncate">
                          {t.title || t.source}
                        </p>
                        {t.category && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-[#1e2a38] text-gray-500 dark:text-gray-400 font-medium">
                            {t.category}
                          </span>
                        )}
                      </div>

                      {/* Date & Time (DD/MM/YYYY • hh:mm AM/PM) */}
                      <p className="text-[10px] text-[#8a9bb0] mt-0.5">
                        {formatDateTime(t.date, t.time)}
                        {t.paymentMethod ? ` • ${t.paymentMethod}` : ''}
                      </p>

                      {/* Current Running Balance under description */}
                      {t.runningBalance !== undefined && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[9px] font-semibold text-[#8a9bb0]">Balance:</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            t.runningBalance >= 0 
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' 
                              : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                          }`}>
                            ₹{parseFloat(t.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p
                        className="text-sm font-black"
                        style={{ color: t.txType === 'income' ? '#10b981' : '#f87171' }}
                      >
                        {t.txType === 'income' ? '+' : '−'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                      </p>

                      <div className="flex items-center gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingTx(t)}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center text-[#6b7a8d] hover:text-[#4a9eff] active:scale-90 transition-all"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(t)}
                          className="w-7 h-7 rounded-lg bg-[#fff5f5] dark:bg-[#3a1a1a] flex items-center justify-center text-[#f87171] hover:text-red-600 active:scale-90 transition-all"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <EditTransactionModal
          isOpen={!!editingTx}
          onClose={() => setEditingTx(null)}
          transaction={editingTx}
          accountId={accountId}
          accountType={account?.type}
          accent={accent}
          onSuccess={() => {
            fetchTransactions();
            onUpdate?.();
          }}
          onDeleteSuccess={() => {
            fetchTransactions();
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
}
