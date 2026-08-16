import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, ArrowUpRight, Sparkles, Eye, EyeOff } from 'lucide-react';
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

const AnimatedDashboard = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incomeList, setIncomeList] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeCard, setActiveCard] = useState(null);

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-purple-400 animate-pulse" />
        </div>
      </div>
    );
  }

  const totalIncome = calculateTotalIncome(incomeList);
  const totalExpenses = calculateTotalExpenses(expenses);
  const balance = calculateBalance(incomeList, expenses);

  const allTransactions = [
    ...expenses.map(exp => ({ ...exp, type: 'expense', emoji: CATEGORY_EMOJIS[exp.category] || '💼' })),
    ...incomeList.map(inc => ({ ...inc, type: 'income', emoji: '💰' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pb-24 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 px-4 pt-6">
        {/* Header */}
        <div className="mb-8 animate-slide-down">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-purple-200 text-sm font-medium">Welcome back,</p>
              <h1 className="text-white text-3xl font-black flex items-center gap-2">
                {currentUser?.displayName?.split(' ')[0] || 'User'}
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </h1>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold shadow-2xl animate-float">
              {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Balance Card - Glassmorphism */}
        <div className="mb-8 animate-scale-in">
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
            
            {/* Main Card */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-purple-200 text-sm font-semibold uppercase tracking-wider">Total Balance</span>
                </div>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
                >
                  {balanceVisible ? (
                    <Eye className="w-5 h-5 text-white" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
              
              <div className="mb-6">
                {balanceVisible ? (
                  <h2 className="text-white text-6xl font-black tracking-tight">
                    ₹{balance.toFixed(2)}
                  </h2>
                ) : (
                  <h2 className="text-white text-6xl font-black tracking-tight">
                    ₹••••••
                  </h2>
                )}
              </div>

              {/* Income/Expense Mini Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/20 backdrop-blur-sm rounded-2xl p-4 border border-green-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-xs font-semibold">Income</span>
                  </div>
                  <p className="text-white text-2xl font-bold">₹{totalIncome.toFixed(2)}</p>
                </div>
                
                <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-xs font-semibold">Expense</span>
                  </div>
                  <p className="text-white text-2xl font-bold">₹{totalExpenses.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Floating */}
        <div className="mb-8 animate-slide-up">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/add-income')}
              onMouseEnter={() => setActiveCard('income')}
              onMouseLeave={() => setActiveCard(null)}
              className="relative group"
            >
              <div className={`absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500 ${activeCard === 'income' ? 'animate-pulse' : ''}`}></div>
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-lg font-bold">Add Income</span>
                  <ArrowUpRight className="w-6 h-6 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
                <div className="text-6xl mb-2">💰</div>
                <p className="text-green-100 text-sm">Track your earnings</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/add-expense')}
              onMouseEnter={() => setActiveCard('expense')}
              onMouseLeave={() => setActiveCard(null)}
              className="relative group"
            >
              <div className={`absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500 ${activeCard === 'expense' ? 'animate-pulse' : ''}`}></div>
              <div className="relative bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-lg font-bold">Add Expense</span>
                  <ArrowUpRight className="w-6 h-6 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
                <div className="text-6xl mb-2">💸</div>
                <p className="text-red-100 text-sm">Record spending</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Transactions - Animated List */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-xl font-bold flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
              Recent Activity
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="text-purple-300 text-sm font-semibold hover:text-white transition-colors flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {allTransactions.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
                <div className="text-6xl mb-3">📊</div>
                <p className="text-purple-200 font-medium">No transactions yet</p>
                <p className="text-purple-300 text-sm mt-1">Start tracking your finances!</p>
              </div>
            ) : (
              allTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02] animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                      transaction.type === 'expense' 
                        ? 'bg-red-500/20 border border-red-400/30' 
                        : 'bg-green-500/20 border border-green-400/30'
                    }`}>
                      {transaction.emoji}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-lg truncate">
                        {transaction.title || transaction.source}
                      </p>
                      <p className="text-purple-200 text-sm">
                        {new Date(transaction.date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-2xl font-black ${
                        transaction.type === 'expense' ? 'text-red-400' : 'text-green-400'
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
        <div className="mt-8 grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
            <p className="text-purple-200 text-xs font-semibold mb-1">Transactions</p>
            <p className="text-white text-2xl font-black">{expenses.length + incomeList.length}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
            <p className="text-purple-200 text-xs font-semibold mb-1">This Month</p>
            <p className="text-white text-2xl font-black">{expenses.length}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
            <p className="text-purple-200 text-xs font-semibold mb-1">Categories</p>
            <p className="text-white text-2xl font-black">
              {new Set(expenses.map(e => e.category)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedDashboard;
