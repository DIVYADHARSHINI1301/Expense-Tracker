import { useState, useEffect } from 'react';
import { Plus, ArrowUpRight } from 'lucide-react';
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

const MobileDashboard = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incomeList, setIncomeList] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  const totalIncome = calculateTotalIncome(incomeList);
  const totalExpenses = calculateTotalExpenses(expenses);
  const balance = calculateBalance(incomeList, expenses);

  // Calculate running balance for transactions
  const allTransactions = [
    ...expenses.map(exp => ({ ...exp, type: 'expense', emoji: CATEGORY_EMOJIS[exp.category] || '💼' })),
    ...incomeList.map(inc => ({ ...inc, type: 'income', emoji: '💰' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  let runningBalance = balance;
  const transactionsWithBalance = allTransactions.map(transaction => {
    const transactionBalance = runningBalance;
    if (transaction.type === 'expense') {
      runningBalance += parseFloat(transaction.amount);
    } else {
      runningBalance -= parseFloat(transaction.amount);
    }
    return { ...transaction, balance: transactionBalance };
  });

  return (
    <div className="min-h-screen pb-24">
      {/* Purple Header */}
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 px-4 pt-6 pb-32 rounded-b-[3rem]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm font-medium">Hi, {currentUser?.displayName?.split(' ')[0] || 'User'}</p>
            <h1 className="text-white text-2xl font-bold">{currentUser?.email?.split('@')[0]?.toUpperCase() || 'USER'}</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-2xl font-bold">
            {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">Current Balance</p>
          <h2 className="text-white text-5xl font-black">₹{balance.toFixed(2)}</h2>
        </div>
      </div>

      {/* Cards Section */}
      <div className="px-4 -mt-24 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Total Credit Card */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 shadow-lg">
            <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Total Credit</p>
            <p className="text-green-600 dark:text-green-400 text-2xl font-bold">₹{totalIncome.toFixed(2)}</p>
          </div>

          {/* Total Expense Card */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 shadow-lg">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Total Expense</p>
            <p className="text-red-600 dark:text-red-400 text-2xl font-bold">₹{totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        {/* Large Circular Buttons */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <button
            onClick={() => navigate('/add-income')}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
              <span className="text-4xl">💰</span>
            </div>
            <span className="text-green-600 dark:text-green-400 font-bold text-sm">Credit</span>
          </button>

          <button
            onClick={() => navigate('/add-expense')}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
              <span className="text-4xl">💸</span>
            </div>
            <span className="text-red-600 dark:text-red-400 font-bold text-sm">Expense</span>
          </button>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-purple-600 dark:text-purple-400 font-bold text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"></span>
              Transactions
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="text-purple-600 dark:text-purple-400 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {transactionsWithBalance.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions yet</p>
            ) : (
              transactionsWithBalance.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                    {transaction.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-100 truncate">
                      {transaction.title || transaction.source}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {transaction.type === 'expense' ? '-' : '+'} ₹{parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ₹{transaction.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
