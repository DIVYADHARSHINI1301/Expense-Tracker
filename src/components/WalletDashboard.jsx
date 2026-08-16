import { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronRight, Clock, X, Calendar, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWalletIncome, getWalletExpenses } from '../firebase/firestore';

const WalletDashboard = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incomeList, setIncomeList] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [inc, exp] = await Promise.all([
          getWalletIncome(currentUser.uid),
          getWalletExpenses(currentUser.uid),
        ]);
        setIncomeList(inc);
        setExpenses(exp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a1929]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalIncome = incomeList.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const balance = totalIncome - totalExpenses;

  const allTx = [
    ...expenses.map(e => ({ ...e, type: 'expense' })),
    ...incomeList.map(i => ({ ...i, type: 'income' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = dateFilter ? allTx.filter(t => t.date.startsWith(dateFilter)) : allTx;
  const recent = filtered.slice(0, 5);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929] pb-6 animate-fade-in">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-800 dark:to-purple-900 px-5 pt-8 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-violet-100 text-xs font-medium mb-1">Cash in Hand</p>
              <h1 className="text-white text-xl font-bold">My Wallet</h1>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M20 12V8a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4"/>
                <path d="M20 12a2 2 0 00-2-2h-2a2 2 0 000 4h2a2 2 0 002-2z"/>
              </svg>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl animate-slide-in stagger-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M20 12V8a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4"/>
                    <path d="M20 12a2 2 0 00-2-2h-2a2 2 0 000 4h2a2 2 0 002-2z"/>
                  </svg>
                </div>
                <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Wallet Balance</span>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                {balanceVisible
                  ? <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  : <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
              </button>
            </div>

            <h2 className="text-gray-900 dark:text-white text-4xl font-black mb-6">
              {balanceVisible ? `₹${balance.toFixed(2)}` : '₹••••••'}
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-800 dark:to-purple-900 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">Income</span>
                </div>
                <p className="text-white text-lg font-bold">₹{totalIncome.toFixed(2)}</p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-purple-400 to-violet-500 dark:from-purple-700 dark:to-violet-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">Expense</span>
                </div>
                <p className="text-white text-lg font-bold">₹{totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H0V0Z" fill="currentColor" className="text-white dark:text-[#0a1929]"/>
          </svg>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 -mt-16 mb-6 relative z-10">
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/wallet/add-income')}
            className="touch-btn flex-1 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-800 dark:to-purple-900 rounded-2xl p-4 shadow-lg"
          >
            <TrendingUp className="w-7 h-7 mb-2 text-white" />
            <p className="text-white text-sm font-bold">Add Income</p>
          </button>
          <button
            onClick={() => navigate('/wallet/add-expense')}
            className="touch-btn flex-1 bg-gradient-to-br from-purple-400 to-violet-500 dark:from-purple-700 dark:to-violet-800 rounded-2xl p-4 shadow-lg"
          >
            <TrendingDown className="w-7 h-7 mb-2 text-white" />
            <p className="text-white text-sm font-bold">Add Expense</p>
          </button>
          <button
            onClick={() => navigate('/wallet/analytics')}
            className="touch-btn flex-1 bg-gradient-to-br from-fuchsia-500 to-purple-600 dark:from-fuchsia-800 dark:to-purple-900 rounded-2xl p-4 shadow-lg"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 mb-2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <p className="text-white text-sm font-bold">Analytics</p>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            <h3 className="text-gray-900 dark:text-white text-base font-bold">Recent Transactions</h3>
          </div>
          <button
            onClick={() => navigate('/wallet/history')}
            className="flex items-center gap-1 text-violet-500 text-xs font-semibold"
          >
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date Filter */}
        <div className="mb-4 relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {recent.length === 0 ? (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No wallet transactions yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Add income or expense to get started</p>
            </div>
          ) : (
            recent.map((tx, i) => (
              <div
                key={i}
                onClick={() => setSelectedTx(tx)}
                className="touch-card bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer animate-slide-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.type === 'expense'
                      ? 'bg-gradient-to-br from-purple-400 to-violet-500 dark:from-purple-700 dark:to-violet-800'
                      : 'bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-800 dark:to-purple-900'
                  }`}>
                    {tx.type === 'expense'
                      ? <TrendingDown className="w-6 h-6 text-white" />
                      : <TrendingUp className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
                      {tx.title || tx.source}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className={`text-base font-bold ${
                    tx.type === 'expense' ? 'text-violet-500' : 'text-purple-600 dark:text-violet-400'
                  }`}>
                    {tx.type === 'expense' ? '−' : '+'} ₹{parseFloat(tx.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTx(null)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl max-w-md w-full shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Details</h2>
              <button onClick={() => setSelectedTx(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <table className="w-full">
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    ['Name', selectedTx.title || selectedTx.source],
                    ['Type', selectedTx.type === 'expense' ? 'Expense' : 'Income'],
                    ['Amount', `₹${parseFloat(selectedTx.amount).toFixed(2)}`],
                    ['Date', new Date(selectedTx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                    ...(selectedTx.category ? [['Category', selectedTx.category]] : []),
                    ...(selectedTx.notes ? [['Notes', selectedTx.notes]] : []),
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</td>
                      <td className="py-3 text-sm text-right text-gray-900 dark:text-white font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDashboard;
