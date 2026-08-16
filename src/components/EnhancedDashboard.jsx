import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Target, AlertCircle, TrendingUpIcon, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getIncome, getExpenses, getBudget, calculateTotalIncome, calculateTotalExpenses, calculateBalance, calculateSavingsPercentage } from '../firebase/firestore';

const EnhancedDashboard = ({ refreshTrigger }) => {
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
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-xl font-semibold animate-pulse">Loading your financial data...</p>
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
      gradient: 'from-emerald-400 via-green-500 to-teal-600',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-green-600',
      iconColor: 'text-white',
      textColor: 'text-emerald-600',
      change: '+12.5%',
      changePositive: true
    },
    { 
      title: 'Total Expenses', 
      value: totalExpenses, 
      icon: TrendingDown, 
      gradient: 'from-rose-400 via-red-500 to-pink-600',
      iconBg: 'bg-gradient-to-br from-rose-400 to-red-600',
      iconColor: 'text-white',
      textColor: 'text-rose-600',
      change: '+8.2%',
      changePositive: false
    },
    { 
      title: 'Balance', 
      value: balance, 
      icon: Wallet, 
      gradient: 'from-blue-400 via-indigo-500 to-purple-600',
      iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-600',
      iconColor: 'text-white',
      textColor: 'text-blue-600',
      change: '+4.3%',
      changePositive: true
    },
    { 
      title: 'Monthly Budget', 
      value: budget, 
      icon: Target, 
      gradient: 'from-purple-400 via-violet-500 to-indigo-600',
      iconBg: 'bg-gradient-to-br from-purple-400 to-violet-600',
      iconColor: 'text-white',
      textColor: 'text-purple-600',
      change: 'Set',
      changePositive: true
    },
    { 
      title: 'Savings Rate', 
      value: `${savingsPercentage}%`, 
      icon: PiggyBank, 
      gradient: 'from-amber-400 via-yellow-500 to-orange-600',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-600',
      iconColor: 'text-white',
      textColor: 'text-amber-600',
      isPercentage: true,
      change: parseFloat(savingsPercentage) >= 20 ? 'Excellent' : 'Good',
      changePositive: true
    }
  ];

  return (
    <div className="p-3 md:p-8 animate-fade-in">
      {/* Floating Particles Background */}
      <div className="particles fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: Math.random() * 10 + 5 + 'px',
              height: Math.random() * 10 + 5 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 6 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}
      </div>

      {/* Header with Greeting */}
      <div className="mb-6 md:mb-8 relative">
        <div className="flex items-center gap-2 md:gap-3 mb-3">
          <div className="p-2 md:p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl md:rounded-2xl animate-float">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-1 md:mb-2 animate-slide-down">
              Welcome back, {currentUser?.displayName?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="text-white/90 text-xs md:text-base lg:text-lg font-medium animate-slide-down" style={{ animationDelay: '0.1s' }}>
              Here's your financial overview for today
            </p>
          </div>
        </div>
      </div>
      
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-10">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className="glass rounded-2xl md:rounded-3xl p-5 md:p-7 card-hover animate-scale-in group relative overflow-hidden"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Gradient Overlay on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4 md:mb-5">
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${card.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`w-5 h-5 md:w-7 md:h-7 ${card.iconColor}`} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${card.gradient} text-white shadow-md animate-pulse-slow`}>
                    LIVE
                  </span>
                </div>
              </div>
              
              <h3 className="text-gray-600 text-xs md:text-sm font-semibold mb-2 md:mb-3 uppercase tracking-wide">{card.title}</h3>
              
              <div className="flex items-end justify-between">
                <p className={`text-2xl md:text-4xl lg:text-5xl font-black ${card.textColor} mb-1 group-hover:scale-105 transition-transform`}>
                  {card.isPercentage ? card.value : `₹${card.value.toFixed(2)}`}
                </p>
              </div>
              
              <div className="flex items-center gap-1 md:gap-2 mt-3 md:mt-4">
                {card.changePositive ? (
                  <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                )}
                <span className={`text-xs md:text-sm font-semibold ${card.changePositive ? 'text-green-600' : 'text-red-600'}`}>
                  {card.change}
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts & Insights with Enhanced Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        {/* Budget Alert */}
        {budget > 0 && totalExpenses > budget && (
          <div className="glass rounded-2xl md:rounded-3xl p-5 md:p-7 border-l-4 border-red-500 animate-slide-left card-hover">
            <div className="flex items-start gap-3 md:gap-5">
              <div className="p-3 md:p-4 bg-gradient-to-br from-red-400 to-rose-600 rounded-xl md:rounded-2xl shadow-lg animate-glow">
                <AlertCircle className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-black text-red-600 mb-2 flex items-center gap-2">
                  Budget Alert! 
                  <span className="text-xl md:text-2xl animate-pulse">⚠️</span>
                </h3>
                <p className="text-gray-700 text-sm md:text-base mb-3 md:mb-4 font-medium">
                  You've exceeded your monthly budget by <span className="font-black text-red-600">₹{(totalExpenses - budget).toFixed(2)}</span>
                </p>
                <div className="w-full bg-red-100 rounded-full h-2 md:h-3 mt-3 md:mt-4 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-rose-600 h-2 md:h-3 rounded-full transition-all duration-1000 progress-bar relative"
                    style={{ width: `${Math.min((totalExpenses / budget) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3 font-semibold">{((totalExpenses / budget) * 100).toFixed(1)}% of budget used</p>
              </div>
            </div>
          </div>
        )}

        {/* Spending Insight */}
        {topCategory && (
          <div className="glass rounded-2xl md:rounded-3xl p-5 md:p-7 border-l-4 border-blue-500 animate-slide-right card-hover">
            <div className="flex items-start gap-3 md:gap-5">
              <div className="p-3 md:p-4 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl md:rounded-2xl shadow-lg">
                <TrendingDown className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-black text-blue-600 mb-2">Top Spending Category</h3>
                <p className="text-gray-700 text-sm md:text-base mb-3 md:mb-4 font-medium">
                  You spent most on <span className="font-black text-blue-600">{topCategory[0]}</span> this month
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 md:mt-4 bg-blue-50 p-3 md:p-4 rounded-xl gap-2">
                  <span className="text-2xl md:text-3xl font-black text-blue-600">₹{topCategory[1].toFixed(2)}</span>
                  <span className="text-xs md:text-sm font-bold text-blue-500 bg-blue-100 px-2 md:px-3 py-1 rounded-full">
                    {((topCategory[1] / totalExpenses) * 100).toFixed(1)}% of total
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Savings Goal */}
        {totalIncome > 0 && (
          <div className="glass rounded-3xl p-7 border-l-4 border-green-500 animate-slide-left card-hover" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-5">
              <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-lg">
                <PiggyBank className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-green-600 mb-2">Savings Progress</h3>
                <p className="text-gray-700 text-base mb-4 font-medium">
                  You're saving <span className="font-black text-green-600">{savingsPercentage}%</span> of your income
                </p>
                <div className="w-full bg-green-100 rounded-full h-3 mt-4 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 progress-bar"
                    style={{ width: `${Math.min(savingsPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-3 font-semibold flex items-center gap-2">
                  {parseFloat(savingsPercentage) >= 20 ? (
                    <><span className="text-2xl">🎉</span> Excellent! Keep it up!</>
                  ) : (
                    <><span className="text-2xl">💪</span> Good start! Aim for 20%</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="glass rounded-3xl p-7 border-l-4 border-purple-500 animate-slide-right card-hover" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-5">
            <div className="p-4 bg-gradient-to-br from-purple-400 to-violet-600 rounded-2xl shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-purple-600 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl">
                  <span className="text-base text-gray-700 font-semibold">Total Transactions</span>
                  <span className="font-black text-2xl text-purple-600">{expenses.length}</span>
                </div>
                <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl">
                  <span className="text-base text-gray-700 font-semibold">Avg. Expense</span>
                  <span className="font-black text-2xl text-purple-600">
                    ₹{expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl">
                  <span className="text-base text-gray-700 font-semibold">Categories Used</span>
                  <span className="font-black text-2xl text-purple-600">{Object.keys(categoryTotals).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
