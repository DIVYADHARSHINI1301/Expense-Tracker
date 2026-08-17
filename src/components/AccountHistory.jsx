import { useState, useEffect } from 'react';
import { ArrowLeft, Search, X, Calendar, Trash2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounts } from '../context/AccountsContext';
import { acctGetIncome, acctGetExpenses, acctDeleteIncome, acctDeleteExpense } from '../firebase/accountFirestore';
import CategoryIcon from './CategoryIcons';
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

  useEffect(() => {
    if (!currentUser || !accountId) return;
    setLoading(true);
    Promise.all([
      acctGetIncome(currentUser.uid, accountId),
      acctGetExpenses(currentUser.uid, accountId),
    ]).then(([inc, exp]) => {
      setAll([
        ...exp.map(e => ({ ...e, txType: 'expense' })),
        ...inc.map(i => ({ ...i, txType: 'income'  })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser, accountId]);

  const handleDelete = async (tx) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      if (tx.txType === 'income') await acctDeleteIncome(currentUser.uid, accountId, tx.id);
      else await acctDeleteExpense(currentUser.uid, accountId, tx.id);
      setAll(prev => prev.filter(t => t.id !== tx.id));
      toast.success('Deleted');
      onUpdate?.();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <GlowLoader label="Loading history..." />;

  const filtered = all.filter(t => {
    const matchSearch = !search || (t.title || t.source || '').toLowerCase().includes(search.toLowerCase());
    const matchDate   = !dateFilter || t.date?.startsWith(dateFilter);
    const matchType   = typeFilter === 'all' || t.txType === typeFilter;
    return matchSearch && matchDate && matchType;
  });

  const totalIncome   = all.filter(t => t.txType === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpenses = all.filter(t => t.txType === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117] flex flex-col">

      {/* Header - STICKY */}
      <div className="sticky top-0 z-40 px-4 pt-5 pb-4 shadow-lg transition-shadow duration-300" style={{ background: `linear-gradient(135deg, ${accent}ee, ${accent}99)` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/account/${accountId}`)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-white text-base font-bold">History</h1>
            <p className="text-white/60 text-xs">{account?.name || 'Account'}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 space-y-3 pb-32">

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${accent}30` }}>
                <TrendingUp className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-[#8a9bb0] text-[9px] uppercase tracking-wider">Income</p>
                <p className="text-gray-900 dark:text-white text-xs font-black">₹{totalIncome.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a2332] rounded-xl p-3 flex items-center gap-2 border border-gray-100 dark:border-[#1e2a38]">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-[#3a1a1a] flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 text-[#f87171]" />
              </div>
              <div>
                <p className="text-[#8a9bb0] text-[9px] uppercase tracking-wider">Expenses</p>
                <p className="text-gray-900 dark:text-white text-xs font-black">₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-gray-100 dark:border-[#1e2a38] p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
              <input type="text" placeholder="Search transactions..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-[#1a2332] border border-gray-200 dark:border-[#1e2a38] text-gray-800 dark:text-[#c8d8e8] focus:outline-none"
                style={{ '--focus-border': accent }} />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 active:scale-90 transition-transform">
                  <X className="w-3.5 h-3.5 text-[#8a9bb0]" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3 h-3" />
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#1a2332] border border-gray-200 dark:border-[#1e2a38] text-gray-800 dark:text-[#c8d8e8] focus:outline-none" />
              </div>
              <div className="flex gap-1">
                {['all', 'income', 'expense'].map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className="px-2.5 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                    style={typeFilter === t
                      ? { backgroundColor: accent, color: '#fff' }
                      : { background: 'transparent', color: '#8a9bb0', border: '1px solid #e2e8f0' }}>
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
              </div>
            ) : (
              filtered.map((t, i) => (
                <div key={t.id}
                  className="bg-white dark:bg-[#161d27] rounded-xl overflow-hidden animate-card-in"
                  style={{ border: `1px solid ${accent}18`, animationDelay: `${Math.min(i, 8) * 0.03}s` }}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: t.txType === 'income' ? `${accent}18` : 'rgba(248,113,113,0.1)' }}>
                      {t.txType === 'expense'
                        ? <CategoryIcon category={t.category} className="w-4 h-4 text-[#f87171]" />
                        : <Wallet className="w-4 h-4" style={{ color: accent }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-[#c8d8e8] truncate">{t.title || t.source}</p>
                      <p className="text-[10px] text-[#8a9bb0]">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-sm font-black flex-shrink-0"
                      style={{ color: t.txType === 'income' ? accent : '#f87171' }}>
                      {t.txType === 'income' ? '+' : '−'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                    </p>
                    <button onClick={() => handleDelete(t)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#f87171] active:scale-90 transition-transform flex-shrink-0"
                      style={{ background: 'rgba(248,113,113,0.1)' }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
