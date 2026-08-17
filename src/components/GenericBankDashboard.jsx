import { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronRight, Clock, X, Calendar, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { acctGetIncome, acctGetExpenses } from '../firebase/accountFirestore';
import CategoryIcon from './CategoryIcons';
import ActionIcon from './ActionIcons';
import GlowLoader from './GlowLoader';

const darken = (hex, amt = 40) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
};

const ACTIONS = (id) => [
  { label: 'Add Income',  type: 'Income',    path: `/account/${id}/add-income`  },
  { label: 'Add Expense', type: 'Expense',   path: `/account/${id}/add-expense` },
  { label: 'Analytics',   type: 'Analytics', path: `/account/${id}/analytics`   },
  { label: 'History',     type: 'Budget',    path: `/account/${id}/history`     },
];

export default function GenericBankDashboard({ account, refreshTrigger }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incomeList, setIncomeList] = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [balVisible, setBalVisible] = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  const accent  = account.accent || '#4a9eff';
  const accentD = darken(accent, 35);

  useEffect(() => {
    if (!currentUser || !account?.id) return;
    setLoading(true);
    Promise.all([
      acctGetIncome(currentUser.uid, account.id),
      acctGetExpenses(currentUser.uid, account.id),
    ]).then(([inc, exp]) => {
      setIncomeList(inc);
      setExpenses(exp);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser, account?.id, refreshTrigger]);

  if (loading) return <GlowLoader label={`Loading ${account.name}...`} />;

  const totalIncome   = incomeList.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const balance       = totalIncome - totalExpenses;
  const savingsPct    = totalIncome > 0 ? Math.min(100, ((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const all = [
    ...expenses.map(e  => ({ ...e,  txType: 'expense' })),
    ...incomeList.map(i => ({ ...i, txType: 'income'  })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const recent = (dateFilter ? all.filter(t => t.date?.startsWith(dateFilter)) : all).slice(0, 3);

  return (
    <div className="min-h-screen pb-6 animate-fade-in bg-[#f4f6f8] dark:bg-[#0d1117]">

      {/* Header — accent gradient, STICKY */}
      <div className="sticky top-0 z-40 px-4 pt-6 pb-5 shadow-lg transition-shadow duration-300" style={{ background: `linear-gradient(135deg, ${accent}, ${accentD})` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-medium tracking-wide">
              {account.name}
            </p>
            <h1 className="text-white text-lg font-bold mt-0.5">
              {currentUser?.displayName?.split(' ')[0] || 'Welcome'}
            </h1>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)' }}>
            {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Balance card — with top spacing */}
      <div className="px-4 mt-4">
        <div className="rounded-2xl p-5 animate-card-in bg-white dark:bg-[#1a2332] shadow-sm border border-gray-100 dark:border-[#1e2a38]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-500 dark:text-[#8a9bb0] text-[10px] font-semibold uppercase tracking-widest">Available Balance</span>
            <button onClick={() => setBalVisible(!balVisible)}
              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#2a3a4e] flex items-center justify-center active:scale-90 transition-transform">
              {balVisible
                ? <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-[#8a9bb0]" />
                : <EyeOff className="w-3.5 h-3.5 text-gray-500 dark:text-[#8a9bb0]" />}
            </button>
          </div>
          <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight mb-4">
            {balVisible ? `₹${balance.toLocaleString('en-IN')}` : '₹ ••••••'}
          </h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-400 dark:text-[#8a9bb0] text-[10px] font-medium">Savings rate</span>
              <span className="text-[10px] font-bold" style={{ color: accent }}>{savingsPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-[#2a3a4e] rounded-full overflow-hidden">
              <div className="h-full rounded-full progress-animated"
                style={{ width: `${Math.max(0, savingsPct)}%`, background: `linear-gradient(90deg, ${accent}, ${accentD})` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 flex items-center gap-2.5"
              style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${accent}25` }}>
                <ArrowUpRight className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-gray-400 dark:text-[#8a9bb0] text-[9px] font-semibold uppercase tracking-wider">Income</p>
                <p className="text-gray-900 dark:text-white text-xs font-black">₹{totalIncome.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="rounded-xl p-3 flex items-center gap-2.5 bg-red-50 dark:bg-[#0f1923]"
              style={{ border: '1px solid rgba(248,113,113,0.15)' }}>
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-[#3a1a1a] flex items-center justify-center flex-shrink-0">
                <ArrowDownRight className="w-4 h-4 text-[#f87171]" />
              </div>
              <div>
                <p className="text-gray-400 dark:text-[#8a9bb0] text-[9px] font-semibold uppercase tracking-wider">Spent</p>
                <p className="text-gray-900 dark:text-white text-xs font-black">₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <p className="text-gray-400 dark:text-[#6b7a8d] text-[10px] font-bold uppercase tracking-widest mb-2.5">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS(account.id).map(({ label, type, path }, i) => (
            <button key={path} onClick={() => navigate(path)}
              className="rounded-xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform animate-card-in bg-white dark:bg-[#161d27] shadow-sm"
              style={{ border: `1px solid ${accent}20`, animationDelay: `${i * 0.05}s` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}15` }}>
                <ActionIcon type={type} className="w-5 h-5" style={{ color: accent }} />
              </div>
              <p className="text-[9px] font-bold text-gray-500 dark:text-[#8a9bb0] text-center leading-tight">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-[#6b7a8d]" />
            <p className="text-[10px] font-bold text-gray-400 dark:text-[#6b7a8d] uppercase tracking-widest">Recent Transactions</p>
          </div>
          <button onClick={() => navigate(`/account/${account.id}/history`)}
            className="flex items-center gap-0.5 text-[10px] font-bold active:scale-95 transition-transform" style={{ color: accent }}>
            See All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mb-3 relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl bg-white dark:bg-[#161d27] text-gray-800 dark:text-[#c8d8e8] focus:outline-none transition-colors"
            style={{ border: `1.5px solid ${accent}30` }} />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 active:scale-90 transition-transform">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {recent.length === 0 ? (
            <div className="rounded-xl p-8 text-center bg-white dark:bg-[#161d27]"
              style={{ border: `1px solid ${accent}20` }}>
              <p className="text-sm font-semibold text-gray-400 dark:text-[#6b7a8d]">No transactions yet</p>
              <p className="text-xs text-gray-400 dark:text-[#8a9bb0] mt-1">Start tracking your finances</p>
            </div>
          ) : (
            recent.map((t, i) => (
              <div key={i} onClick={() => setSelected(t)}
                className="rounded-xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform animate-card-in bg-white dark:bg-[#161d27]"
                style={{ border: `1px solid ${accent}18`, animationDelay: `${i * 0.04}s` }}>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: t.txType === 'income' ? `${accent}18` : 'rgba(248,113,113,0.1)' }}>
                    {t.txType === 'expense'
                      ? <CategoryIcon category={t.category} className="w-4 h-4 text-[#f87171]" />
                      : <Wallet className="w-4 h-4" style={{ color: accent }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-[#c8d8e8] truncate">{t.title || t.source}</p>
                  </div>
                  <p className="text-sm font-black flex-shrink-0"
                    style={{ color: t.txType === 'income' ? accent : '#f87171' }}>
                    {t.txType === 'income' ? '+' : '−'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail modal - CENTER POPUP */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-[#161d27] rounded-3xl w-full max-w-sm shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${accent}, ${accentD})` }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#1e2a38]">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Transaction Details</p>
              <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center active:scale-90 transition-transform">
                <X className="w-3.5 h-3.5 text-gray-400 dark:text-[#6b7a8d]" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Name',   selected.title || selected.source, ''],
                ['Type',   selected.txType === 'expense' ? 'Expense' : 'Income', ''],
                ['Date',   new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), ''],
                ['Amount', `₹${parseFloat(selected.amount).toLocaleString('en-IN')}`, 'font-black'],
                ...(selected.category      ? [['Category', selected.category,      '']] : []),
                ...(selected.paymentMethod ? [['Payment',  selected.paymentMethod, '']] : []),
                ...(selected.notes         ? [['Notes',    selected.notes,         'italic']] : []),
              ].map(([label, value, cls]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#1e2a38] last:border-0">
                  <span className="text-xs font-semibold text-gray-400 dark:text-[#8a9bb0]">{label}</span>
                  <span className={`text-xs text-gray-800 dark:text-[#c8d8e8] ${cls}`}
                    style={
                      label === 'Amount' ? { color: accent } :
                      label === 'Type' && selected.txType === 'income' ? { color: accent } :
                      label === 'Type' && selected.txType === 'expense' ? { color: '#f87171' } : {}
                    }>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
