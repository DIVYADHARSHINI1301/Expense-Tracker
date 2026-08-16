import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight } from 'lucide-react';
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

const MinimalDashboard = ({ refreshTrigger }) => {
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalIncome = calculateTotalIncome(incomeList);
  const totalExpenses = calculateTotalExpenses(expenses);
  const balance = calculateBalance(incomeList, expenses);

  const recentTransactions = [
    ...expenses.map(exp => ({ ...exp, type: 'expense', emoji: CATEGORY_EMOJIS[exp.category] || '💼' })),
    ...incomeList.map(inc => ({ ...inc, type: 'income', emoji: '💰' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-900 dark:to-purple-950 px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-purple-100 text-xs font-medium mb-1">Welcome back</p>
            <h1 className="text-white text-lg font-bold">
              {currentUser?.displayName?.split(' ')[0] || 'User'}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm font-bold">
            {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-100 text-xs font-medium uppercase tracking-wide">Total Balance</span>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              {balanceVisible ? (
                <Eye className="w-4 h-4 text-white" />
              ) : (
                <EyeOff className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          
          <h2 className="text-white text-3xl font-bold mb-4">
            {balanceVisible ? `₹${balance.toFixed(2)}` : '₹••••••'}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/20 rounded-xl p-3 border border-green-400/30">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-300 text-xs font-medium">Income</span>
              </div>
              <p className="text-white text-base font-bold">₹{totalIncome.toFixed(2)}</p>
            </div>
            
            <div className="bg-red-500/20 rounded-xl p-3 border border-red-400/30">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-red-300 text-xs font-medium">Expense</span>
              </div>
              <p className="text-white text-base font-bold">₹{totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 -mt-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/add-income')}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 active:scale-95 transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-900 dark:text-white text-sm font-semibold">Add Income</span>
              <ArrowRight className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl mb-1">💰</div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Track earnings</p>
          </button>

          <button
            onClick={() => navigate('/add-expense')}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 active:scale-95 transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-900 dark:text-white text-sm font-semibold">Add Expense</span>
              <ArrowRight className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl mb-1">💸</div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Record spending</p>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-900 dark:text-white text-base font-bold">Recent Activity</h3>
          <button
            onClick={() => navigate('/history')}
            className="text-purple-600 dark:text-purple-400 text-xs font-semibold flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-800">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No transactions yet</p>
            </div>
          ) : (
            recentTransactions.map((transaction, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    transaction.type === 'expense' 
                      ? 'bg-red-50 dark:bg-red-950/30' 
                      : 'bg-green-50 dark:bg-green-950/30'
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
                        month: 'short'
                      })}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      transaction.type === 'expense' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'} ₹{parseFloat(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Total</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{expenses.length + incomeList.length}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Expenses</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{expenses.length}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Income</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{incomeList.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalDashboard;
