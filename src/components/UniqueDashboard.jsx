import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, EyeOff, ChevronRight, Wallet, PieChart, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getIncome, getExpenses, calculateTotalIncome, calculateTotalExpenses, calculateBalance } from '../firebase/firestore';

const CATEGORY_EMOJIS = {
  Food: '🍔',
  Travel: '✈️',
  Shopping: '🛍️',
  Bills: '💳',
  Entertainment: '🎬',
  Education: '📚',
  Health: '⚕️',
  Others: '💼'
};

const UniqueDashboard = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incomeList, setIncomeList] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          const [incomeData, expenseData] = await Promise.all([
            getIncome(currentUser.uid),
            getExpenses(currentUser.uid)
          ]);
          setIncomeList(incomeData);
          setExpenses(expenseData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalIncome = calculateTotalIncome(incomeList);
  const totalExpenses = calculateTotalExpenses(expenses);
  const balance = calculateBalance(incomeList, expenses);

  const recentTransactions = [
    ...expenses.map(exp => ({ ...exp, type: 'expense', emoji: CATEGORY_EMOJIS[exp.category] || '💼' })),
    ...incomeList.map(inc => ({ ...inc, type: 'income', emoji: '💰' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 pb-20">
      {/* Unique Header with Wave */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 px-5 pt-8 pb-24 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-blue-100 text-xs font-medium mb-1">Good Morning</p>
              <h1 className="text-white text-xl font-bold">
                {currentUser?.displayName?.split(' ')[0] || 'User'} 👋
              </h1>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-base font-bold shadow-lg"
            >
              {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </button>
          </div>

          {/* Balance Card - Floating */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Available Balance</span>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
              >
                {balanceVisible ? (
                  <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            
            <h2 className="text-gray-900 dark:text-white text-4xl font-black mb-6">
              {balanceVisible ? `₹${balance.toFixed(2)}` : '₹••••••'}
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-green-700 dark:text-green-400 text-xs font-semibold">Income</span>
                </div>
                <p className="text-gray-900 dark:text-white text-lg font-bold">₹{totalIncome.toFixed(2)}</p>
              </div>
              
              <div className="flex-1 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 rounded-2xl p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center">
                    <TrendingDown className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-red-700 dark:text-red-400 text-xs font-semibold">Expense</span>
                </div>
                <p className="text-gray-900 dark:text-white text-lg font-bold">₹{totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="currentColor" className="text-blue-50 dark:text-gray-900"/>
          </svg>
        </div>
      </div>

      {/* Quick Actions - Horizontal Scroll */}
      <div className="px-5 -mt-16 mb-6 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => navigate('/add-income')}
            className="flex-shrink-0 w-36 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">💰</div>
            <p className="text-white text-sm font-bold">Add Income</p>
            <p className="text-green-100 text-xs mt-1">Track earnings</p>
          </button>

          <button
            onClick={() => navigate('/add-expense')}
            className="flex-shrink-0 w-36 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">💸</div>
            <p className="text-white text-sm font-bold">Add Expense</p>
            <p className="text-red-100 text-xs mt-1">Record spending</p>
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="flex-shrink-0 w-36 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">📊</div>
            <p className="text-white text-sm font-bold">Analytics</p>
            <p className="text-blue-100 text-xs mt-1">View insights</p>
          </button>

          <button
            onClick={() => navigate('/budget')}
            className="flex-shrink-0 w-36 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-white text-sm font-bold">Budget</p>
            <p className="text-purple-100 text-xs mt-1">Set limits</p>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-gray-900 dark:text-white text-base font-bold">Recent Transactions</h3>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-semibold"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No transactions yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Start tracking your finances</p>
            </div>
          ) : (
            recentTransactions.map((transaction, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    transaction.type === 'expense' 
                      ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30' 
                      : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
                  }`}>
                    {transaction.emoji}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
                      {transaction.title || transaction.source}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(transaction.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-base font-bold ${
                      transaction.type === 'expense' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {transaction.type === 'expense' ? '−' : '＋'} ₹{parseFloat(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-5 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-2">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Total</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{expenses.length + incomeList.length}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Expenses</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{expenses.length}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Income</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{incomeList.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniqueDashboard;
