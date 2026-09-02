import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, ChevronRight, Clock, X, Calendar, TrendingUp, TrendingDown, BarChart3, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { acctGetIncome, acctGetExpenses, acctDeleteIncome, acctDeleteExpense } from '../firebase/accountFirestore';
import { calculateRunningBalances, formatDateTime, formatDateDDMMYYYY, formatTime12Hour } from '../utils/dateUtils';
import EditTransactionModal from './EditTransactionModal';
import GlowLoader from './GlowLoader';
import toast from 'react-hot-toast';

const darken = (hex, amt = 40) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
};

export default function GenericWalletDashboard({ account, refreshTrigger }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incomeList, setIncomeList] = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [balVisible, setBalVisible] = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [editingTx,  setEditingTx]  = useState(null);

  const accent  = account.accent || '#8b5cf6';
  const accentD = darken(accent, 35);

  const fetchData = useCallback(async () => {
    if (!currentUser || !account?.id) return;
    setLoading(true);
    try {
      const [inc, exp] = await Promise.all([
        acctGetIncome(currentUser.uid, account.id),
        acctGetExpenses(currentUser.uid, account.id),
      ]);
      setIncomeList(inc);
      setExpenses(exp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, account?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  if (loading) return <GlowLoader label={`Loading ${account.name}...`} />;

  const totalIncome   = incomeList.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const balance       = totalIncome - totalExpenses;

  const merged = [
    ...expenses.map(e => ({ ...e, txType: 'expense' })),
    ...incomeList.map(i => ({ ...i, txType: 'income' })),
  ];

  const all = calculateRunningBalances(merged).sort((a, b) => new Date(b.date) - new Date(a.date));

  const recent = (dateFilter ? all.filter(t => t.date?.startsWith(dateFilter)) : all).slice(0, 5);

  const handleDelete = async (tx) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      if (tx.txType === 'income') {
        await acctDeleteIncome(currentUser.uid, account.id, tx.id);
      } else {
        await acctDeleteExpense(currentUser.uid, account.id, tx.id);
      }
      toast.success('Deleted');
      setSelected(null);
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen pb-6 animate-fade-in bg-[#f4f6f8] dark:bg-[#0d1117]">
      {/* Header — compact sticky */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-4 shadow-md"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accentD})` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-[10px] font-medium uppercase tracking-wide">Cash / Wallet</p>
            <h1 className="text-white text-base font-bold leading-tight">{account.name}</h1>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M20 12V8a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4"/>
              <path d="M20 12a2 2 0 00-2-2h-2a2 2 0 000 4h2a2 2 0 002-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Balance card */}
      <div className="px-4 mt-4">
        <div className="rounded-2xl p-4 shadow-sm bg-white dark:bg-[#1a2332] border border-gray-100 dark:border-[#1e2a38]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-500 dark:text-[#8a9bb0] text-[10px] font-semibold uppercase tracking-widest">Wallet Balance</span>
            <button onClick={() => setBalVisible(!balVisible)}
              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#2a3a4e] flex items-center justify-center active:scale-90 transition-transform">
              {balVisible ? <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-[#8a9bb0]" /> : <EyeOff className="w-3.5 h-3.5 text-gray-500 dark:text-[#8a9bb0]" />}
            </button>
          </div>
          <h2 className="text-gray-900 dark:text-white text-2xl font-black tracking-tight mb-3">
            {balVisible ? `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹ ••••••'}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
              <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#8a9bb0]">Income</p>
                <p className="text-xs font-black text-gray-900 dark:text-white">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="rounded-xl p-3 flex items-center gap-2 bg-red-50 dark:bg-[#0f1923]"
              style={{ border: '1px solid rgba(248,113,113,0.15)' }}>
              <TrendingDown className="w-4 h-4 text-[#f87171] flex-shrink-0" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#8a9bb0]">Expense</p>
                <p className="text-xs font-black text-gray-900 dark:text-white">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4 mb-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Add Income',  path: `/account/${account.id}/add-income`,  Icon: TrendingUp  },
            { label: 'Add Expense', path: `/account/${account.id}/add-expense`, Icon: TrendingDown },
            { label: 'Analytics',   path: `/account/${account.id}/analytics`,   Icon: BarChart3   },
            { label: 'History',     path: `/account/${account.id}/history`,     Icon: Clock       },
          ].map(({ label, path, Icon }) => (
            <button key={path} onClick={() => navigate(path)}
              className="touch-btn rounded-xl p-3 shadow-sm flex items-center gap-2 active:scale-95 transition-transform bg-white dark:bg-[#1a2332]"
              style={{ border: `1px solid ${accent}20` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${accent}15` }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-[#c8d8e8]">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4">
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
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-[#161d27] text-gray-800 dark:text-[#c8d8e8] focus:outline-none transition-colors border border-gray-100 dark:border-[#1e2a38]"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 active:scale-90 transition-transform">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {recent.length === 0 ? (
            <div className="rounded-xl p-8 text-center bg-white dark:bg-[#161d27] border border-gray-100 dark:border-[#1e2a38]">
              <p className="text-sm font-semibold text-gray-400 dark:text-[#6b7a8d]">No transactions yet</p>
            </div>
          ) : (
            recent.map((tx, i) => (
              <div key={tx.id || i} onClick={() => setSelected(tx)}
                className="rounded-xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform bg-white dark:bg-[#161d27] border border-[#e8ecf0] dark:border-[#1e2a38] hover:border-[#cbd5e1] dark:hover:border-[#334155]"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: tx.txType === 'income' ? `${accent}18` : 'rgba(248,113,113,0.1)' }}>
                    {tx.txType === 'expense'
                      ? <TrendingDown className="w-4 h-4 text-[#f87171]" />
                      : <TrendingUp className="w-4 h-4" style={{ color: accent }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-[#c8d8e8] truncate">{tx.title || tx.source}</p>
                    <p className="text-[10px] text-[#8a9bb0]">
                      {formatDateTime(tx.date, tx.time)}
                    </p>
                    {tx.runningBalance !== undefined && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-[9px] font-medium text-[#8a9bb0]">Balance:</span>
                        <span className={`text-[10px] font-bold ${tx.runningBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          ₹{parseFloat(tx.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-black flex-shrink-0"
                    style={{ color: tx.txType === 'income' ? accent : '#f87171' }}>
                    {tx.txType === 'income' ? '+' : '−'}₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl max-w-sm w-full shadow-2xl animate-pop-in border border-gray-100 dark:border-[#1e2a38] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accentD})` }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-90 transition-transform">
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                ['Description',   selected.title || selected.source, 'font-semibold'],
                ['Type',          selected.txType === 'expense' ? 'Expense' : 'Income', 'font-bold'],
                ['Amount',        `₹${parseFloat(selected.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'font-black'],
                ['Date',          formatDateDDMMYYYY(selected.date), ''],
                ['Time',          formatTime12Hour(selected.time || selected.date), ''],
                ...(selected.runningBalance !== undefined ? [['Balance After', `₹${parseFloat(selected.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'font-bold text-emerald-500']] : []),
                ...(selected.category ? [['Category', selected.category, '']] : []),
                ...(selected.notes    ? [['Notes',    selected.notes, 'italic']]    : []),
              ].map(([label, value, cls]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={`text-xs text-gray-900 dark:text-white ${cls}`}
                    style={label === 'Amount' ? { color: accent } : {}}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Actions in Detail View: Edit & Delete */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <button
                onClick={() => handleDelete(selected)}
                className="px-3 py-2 rounded-xl bg-red-50 dark:bg-[#3a1a1a] text-red-500 font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const toEdit = selected;
                  setSelected(null);
                  setEditingTx(toEdit);
                }}
                className="flex-1 py-2 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                style={{ backgroundColor: accent }}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && (
        <EditTransactionModal
          isOpen={!!editingTx}
          onClose={() => setEditingTx(null)}
          transaction={editingTx}
          accountId={account.id}
          accountType="wallet"
          accent={accent}
          onSuccess={() => {
            fetchData();
          }}
          onDeleteSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
