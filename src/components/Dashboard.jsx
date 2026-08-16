import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Target, AlertCircle, TrendingUpIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getIncome, getExpenses, getBudget, calculateTotalIncome, calculateTotalExpenses, calculateBalance, calculateSavingsPercentage } from '../firebase/firestore';

const Dashboard = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [incomeList, setIncomeList] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          const [incomeData, expenseData, budgetData] = await Promise.all([
            getIncome(currentUser.uid),
            getExpenses(currentUser.uid),
            getBudget(currentUser.uid)
          ]);
          setIncomeList(incomeData);
          setExpenses(expenseData);
          setBudget(budgetData);
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
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your data...</p>
        </div>
      </div>
    );
  }

  const totalIncome = calculateTotalIncome(incomeList);
  const totalExpenses = calculateTotalExpenses(expenses);
  const balance = calculateBalance(incomeList, expenses);
  const savingsPercentage = calculateSavingsPercentage(incomeList, expenses);

  // Get top spending categories
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
    return acc;
  }, {});
  
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const cards = [
    { 
      title: 'Total Income', 
      value: totalIncome, 
      icon: TrendingUp, 
      gradient: 'from-green-400 to-emerald-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-600'
    },
    { 
      title: 'Total Expenses', 
      value: totalExpenses, 
      icon: TrendingDown, 
      gradient: 'from-red-400 to-rose-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-600'
    },
    { 
      title: 'Balance', 
      value: balance, 
      icon: Wallet, 
      gradient: 'from-blue-400 to-indigo-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600'
    },
    { 
      title: 'Monthly Budget', 
      value: budget, 
      icon: Target, 
      gradient: 'from-purple-400 to-violet-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600'
    },
    { 
      title: 'Savings', 
      value: `${savingsPercentage}%`, 
      icon: PiggyBank, 
      gradient: 'from-yellow-400 to-orange-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-600',
      isPercentage: true 
    }
  ];

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/80 text-sm md:text-base">Welcome back, {currentUser?.displayName || 'User'}! Here's your financial overview</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className="glass rounded-2xl p-6 card-hover animate-slide-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${card.gradient} text-white`}>
                Live
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
            <p className={`text-3xl md:text-4xl font-bold ${card.textColor} mb-1`}>
              {card.isPercentage ? card.value : `₹${card.value.toFixed(2)}`}
            </p>
            {!card.isPercentage && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                <TrendingUpIcon className="w-3 h-3" />
                <span>Updated now</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alerts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Budget Alert */}
        {budget > 0 && totalExpenses > budget && (
          <div className="glass rounded-2xl p-6 border-l-4 border-red-500 animate-slide-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-600 mb-1">Budget Alert!</h3>
                <p className="text-gray-700 text-sm mb-2">
                  You've exceeded your monthly budget by <span className="font-bold">₹{(totalExpenses - budget).toFixed(2)}</span>
                </p>
                <div className="w-full bg-red-100 rounded-full h-2 mt-3">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalExpenses / budget) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{((totalExpenses / budget) * 100).toFixed(1)}% of budget used</p>
              </div>
            </div>
          </div>
        )}

        {/* Spending Insight */}
        {topCategory && (
          <div className="glass rounded-2xl p-6 border-l-4 border-blue-500 animate-slide-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-600 mb-1">Top Spending</h3>
                <p className="text-gray-700 text-sm mb-2">
                  You spent most on <span className="font-bold">{topCategory[0]}</span> this month
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-2xl font-bold text-blue-600">₹{topCategory[1].toFixed(2)}</span>
                  <span className="text-xs text-gray-500">{((topCategory[1] / totalExpenses) * 100).toFixed(1)}% of total</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Savings Goal */}
        {totalIncome > 0 && (
          <div className="glass rounded-2xl p-6 border-l-4 border-green-500 animate-slide-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <PiggyBank className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-600 mb-1">Savings Progress</h3>
                <p className="text-gray-700 text-sm mb-2">
                  You're saving <span className="font-bold">{savingsPercentage}%</span> of your income
                </p>
                <div className="w-full bg-green-100 rounded-full h-2 mt-3">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(savingsPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {parseFloat(savingsPercentage) >= 20 ? '🎉 Great job!' : '💪 Keep going!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="glass rounded-2xl p-6 border-l-4 border-purple-500 animate-slide-in">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-purple-600 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Transactions</span>
                  <span className="font-bold text-gray-800">{expenses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Expense</span>
                  <span className="font-bold text-gray-800">
                    ₹{expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Categories Used</span>
                  <span className="font-bold text-gray-800">{Object.keys(categoryTotals).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
