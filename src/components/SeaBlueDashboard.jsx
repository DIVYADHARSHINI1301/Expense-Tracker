import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, EyeOff, ChevronRight, Wallet, Clock, X, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getIncome, getExpenses, calculateTotalIncome, calculateTotalExpenses, calculateBalance } from '../firebase/firestore';
import CategoryIcon from './CategoryIcons';
import ActionIcon from './ActionIcons';
import GlowLoader from './GlowLoader';

const ACTIONS = [
  { label: 'Add Income',  type: 'Income',    path: '/add-income'  },
  { label: 'Add Expense', type: 'Expense',   path: '/add-expense' },
  { label: 'Analytics',   type: 'Analytics', path: '/analytics'   },
  { label: 'Budget',      type: 'Budget',    path: '/budget'      },
];

export default function SeaBlueDashboard({ refreshTrigger }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incomeList, setIncomeList] = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [balVisible, setBalVisible] = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    (async () => {
      if (!currentUser) { setLoading(false); return; }
      setLoading(true);
      try {
        const [inc, exp] = await Promise.all([
          getIncome(currentUser.uid),
          getExpenses(currentUser.uid),
        ]);
        setIncomeList(inc);
        setExpenses(exp);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [currentUser, refreshTrigger]);

  if (loading) return <GlowLoader label="Loading dashboard..." />;

  const totalIncome   = calculateTotalIncome(incomeList);
  const totalExpenses = calculateTotalExpenses(expenses);
  const balance       = calculateBalance(incomeList, expenses);
  const savingsPct    = totalIncome > 0 ? Math.min(100, ((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const all = [
    ...expenses.map(e  => ({ ...e,  type: 'expense' })),
    ...incomeList.map(i => ({ ...i, type: 'income'  })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const recent = (dateFilter ? all.filter(t => t.date.startsWith(dateFilter)) : all).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117] pb-6 animate-fade-in">

      {/* ── Header band ── */}
      <div className="bg-[#1a2332] dark:bg-[#0d1117] px-4 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#8a9bb0] text-xs font-medium tracking-wide">ESAF Bank</p>
            <h1 className="text-white text-lg font-bold mt-0.5">
              {currentUser?.displayName?.split(' ')[0] || 'Welcome'}
            </h1>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-[#2a3a4e] flex items-center justify-center text-white text-sm font-bold border border-[#3a4e62]"
          >
            {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* ── Balance card ── */}
      <div className="px-4 -mt-1">
        <div className="bg-[#1a2332] dark:bg-[#161d27] rounded-2xl p-5 animate-card-in">
          {/* Top row */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#8a9bb0] text-[10px] font-semibold uppercase tracking-widest">Available Balance</span>
            <button
              onClick={() => setBalVisible(!balVisible)}
              className="w-7 h-7 rounded-lg bg-[#2a3a4e] flex items-center justify-center"
            >
              {balVisible
                ? <Eye className="w-3.5 h-3.5 text-[#8a9bb0]" />
                : <EyeOff className="w-3.5 h-3.5 text-[#8a9bb0]" />}
            </button>
          </div>

          {/* Balance amount */}
          <h2 className="text-white text-3xl font-black tracking-tight mb-4">
            {balVisible ? `₹${balance.toLocaleString('en-IN')}` : '₹ ••••••'}
          </h2>

          {/* Savings bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#8a9bb0] text-[10px] font-medium">Savings rate</span>
              <span className="text-[#c8d8e8] text-[10px] font-bold">{savingsPct.toFixed(1)}%</span>
            </div>
            <div className="h-1 bg-[#2a3a4e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4a9eff] rounded-full progress-animated"
                style={{ width: `${Math.max(0, savingsPct)}%` }}
              />
            </div>
          </div>

          {/* Income / Expense row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f1923] rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1a3a2a] flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-4 h-4 text-[#4ade80]" />
              </div>
              <div>
                <p className="text-[#8a9bb0] text-[9px] font-semibold uppercase tracking-wider">Income</p>
                <p className="text-white text-xs font-black">₹{totalIncome.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="bg-[#0f1923] rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#3a1a1a] flex items-center justify-center flex-shrink-0">
                <ArrowDownRight className="w-4 h-4 text-[#f87171]" />
              </div>
              <div>
                <p className="text-[#8a9bb0] text-[9px] font-semibold uppercase tracking-wider">Spent</p>
                <p className="text-white text-xs font-black">₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick actions — 2×2 grid, full width ── */}
      <div className="px-4 mt-4">
        <p className="text-[#6b7a8d] text-[10px] font-bold uppercase tracking-widest mb-2.5">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map(({ label, type, path }, i) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="bg-white dark:bg-[#161d27] rounded-xl p-3 flex flex-col items-center gap-2 border border-[#e8ecf0] dark:border-[#1e2a38] active:scale-95 transition-transform animate-card-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-9 h-9 rounded-xl bg-[#f0f4f8] dark:bg-[#1a2332] flex items-center justify-center">
                <ActionIcon type={type} className="w-5 h-5 text-[#4a9eff]" />
              </div>
              <p className="text-[9px] font-bold text-[#4a5568] dark:text-[#8a9bb0] text-center leading-tight">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#6b7a8d]" />
            <p className="text-[10px] font-bold text-[#6b7a8d] uppercase tracking-widest">Recent Transactions</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-0.5 text-[#4a9eff] text-[10px] font-bold active:scale-95 transition-transform"
          >
            See All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Date filter */}
        <div className="mb-3 relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7a8d] w-3.5 h-3.5" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl bg-white dark:bg-[#161d27] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff] transition-colors"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-[#6b7a8d]" />
            </button>
          )}
        </div>

        {/* Transaction list */}
        <div className="space-y-2">
          {recent.length === 0 ? (
            <div className="bg-white dark:bg-[#161d27] rounded-xl p-8 text-center border border-[#e8ecf0] dark:border-[#1e2a38]">
              <p className="text-sm font-semibold text-[#6b7a8d]">No transactions yet</p>
              <p className="text-xs text-[#8a9bb0] mt-1">Start tracking your finances</p>
            </div>
          ) : (
            recent.map((t, i) => (
              <div
                key={i}
                onClick={() => setSelected(t)}
                className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden cursor-pointer active:scale-[0.99] transition-transform animate-card-in"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${t.type === 'income' ? 'bg-[#f0fdf4] dark:bg-[#1a3a2a]' : 'bg-[#fff5f5] dark:bg-[#3a1a1a]'}`}>
                    {t.type === 'expense'
                      ? <CategoryIcon category={t.category} className="w-4 h-4 text-[#f87171]" />
                      : <Wallet className="w-4 h-4 text-[#4ade80]" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8] truncate">
                      {t.title || t.source}
                    </p>
                    <p className="text-[10px] text-[#8a9bb0] mt-0.5">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Amount */}
                  <p className={`text-sm font-black flex-shrink-0
                    ${t.type === 'income' ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                    {t.type === 'income' ? '+' : '−'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Transaction detail modal ── */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-[#161d27] rounded-t-3xl w-full max-w-lg modal-sheet overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className={`h-1 ${selected.type === 'income' ? 'bg-[#4ade80]' : 'bg-[#f87171]'}`} />
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8ecf0] dark:border-[#1e2a38]">
              <p className="text-sm font-bold text-[#2d3748] dark:text-white">Transaction Details</p>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-full bg-[#f4f6f8] dark:bg-[#1a2332] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-[#6b7a8d]" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                ['Name',   selected.title || selected.source, ''],
                ['Type',   selected.type === 'expense' ? 'Expense' : 'Income', selected.type === 'income' ? 'text-[#4ade80] font-bold' : 'text-[#f87171] font-bold'],
                ['Date',   new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), ''],
                ['Amount', `₹${parseFloat(selected.amount).toLocaleString('en-IN')}`, selected.type === 'income' ? 'text-[#4ade80] font-black' : 'text-[#f87171] font-black'],
                ...(selected.category     ? [['Category', selected.category,     '']] : []),
                ...(selected.paymentMethod? [['Payment',  selected.paymentMethod, '']] : []),
                ...(selected.notes        ? [['Notes',    selected.notes,         'text-[#8a9bb0] italic']] : []),
              ].map(([label, value, cls]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[#f0f4f8] dark:border-[#1e2a38] last:border-0">
                  <span className="text-xs font-semibold text-[#8a9bb0]">{label}</span>
                  <span className={`text-xs text-[#2d3748] dark:text-[#c8d8e8] ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
