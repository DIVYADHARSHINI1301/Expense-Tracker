import { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getBudget, saveBudget, getExpenses, calculateTotalExpenses } from '../firebase/firestore';
import toast from 'react-hot-toast';

const BudgetManager = ({ onUpdate }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          const [budgetData, expenseData] = await Promise.all([
            getBudget(currentUser.uid),
            getExpenses(currentUser.uid)
          ]);
          setBudget(budgetData);
          setInputValue(budgetData || '');
          setTotalExpenses(calculateTotalExpenses(expenseData));
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser]);

  const budgetUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const remaining = budget - totalExpenses;
  const isOver = remaining < 0;
  const isWarning = !isOver && remaining < budget * 0.2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue || parseFloat(inputValue) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }
    setSubmitting(true);
    try {
      await saveBudget(currentUser.uid, parseFloat(inputValue));
      setBudget(parseFloat(inputValue));
      toast.success('🎯 Budget updated!');
      onUpdate();
    } catch {
      toast.error('Failed to update budget');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a1929]">
        <div className="w-8 h-8 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929] pb-24 animate-fade-in">

      {/* Sea Blue Header */}
      <div className="relative bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] dark:from-[#0c4a6e] dark:to-[#082f49] px-5 pt-8 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="touch-btn w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Budget Manager</h1>
            <p className="text-sky-100 text-xs">Set and track your monthly spending limit</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 5C120 10 240 20 360 23.3C480 27 600 23 720 21.7C840 20 960 20 1080 23.3C1200 27 1320 33 1380 36.7L1440 40V60H0V0Z"
              fill="currentColor" className="text-white dark:text-[#0a1929]" />
          </svg>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4">

        {/* Set Budget Card */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] dark:bg-[#0c4a6e]/40 flex items-center justify-center">
              <Target className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Set Monthly Budget</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Control your spending limit</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">
                Budget Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 transition-all text-lg font-semibold bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="touch-btn w-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</>
                : '🎯 Update Budget'}
            </button>
          </form>

          {budget > 0 && (
            <div className="mt-4 p-3 bg-[#e0f2fe] dark:bg-[#0c4a6e]/30 rounded-xl border border-[#bae6fd] dark:border-[#0c4a6e] text-center">
              <p className="text-[#0284c7] dark:text-[#38bdf8] font-bold text-sm">
                Current Budget: ₹{budget.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Progress Card */}
        {budget > 0 && (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Budget Progress</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isOver    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                isWarning ? 'bg-[#fef9c3] dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            'bg-[#e0f2fe] dark:bg-[#0c4a6e]/40 text-[#0284c7] dark:text-[#38bdf8]'
              }`}>
                {budgetUsed.toFixed(1)}% used
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-5 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  isOver    ? 'bg-gradient-to-r from-red-400 to-red-600' :
                  isWarning ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                              'bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9]'
                }`}
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              />
            </div>

            {/* Budget vs Spent */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#e0f2fe] dark:bg-[#0c4a6e]/30 rounded-xl p-4 border border-[#bae6fd] dark:border-[#0c4a6e]">
                <p className="text-xs text-[#0284c7] dark:text-[#38bdf8] font-semibold mb-1">Budget</p>
                <p className="text-xl font-black text-[#0284c7] dark:text-[#38bdf8]">₹{budget.toFixed(0)}</p>
              </div>
              <div className="bg-[#f0f9ff] dark:bg-[#075985]/20 rounded-xl p-4 border border-[#bae6fd] dark:border-[#075985]">
                <p className="text-xs text-[#0369a1] dark:text-[#7dd3fc] font-semibold mb-1">Spent</p>
                <p className="text-xl font-black text-[#0369a1] dark:text-[#7dd3fc]">₹{totalExpenses.toFixed(0)}</p>
              </div>
            </div>

            {/* Remaining */}
            <div className={`rounded-xl p-4 border ${
              isOver
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-[#e0f2fe] dark:bg-[#0c4a6e]/30 border-[#bae6fd] dark:border-[#0c4a6e]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isOver    ? 'bg-red-100 dark:bg-red-900/40' :
                  isWarning ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                              'bg-[#bae6fd] dark:bg-[#0c4a6e]/60'
                }`}>
                  {isOver
                    ? <AlertTriangle className="w-5 h-5 text-red-500" />
                    : <TrendingUp className="w-5 h-5 text-[#0ea5e9]" />
                  }
                </div>
                <div>
                  <p className={`font-bold text-sm ${
                    isOver    ? 'text-red-600 dark:text-red-400' :
                    isWarning ? 'text-yellow-700 dark:text-yellow-400' :
                                'text-[#0284c7] dark:text-[#38bdf8]'
                  }`}>
                    {isOver ? 'Budget Exceeded!' : isWarning ? 'Almost at limit' : 'On Track 🎉'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                    {isOver
                      ? `Over by ₹${Math.abs(remaining).toFixed(2)}`
                      : `₹${remaining.toFixed(2)} remaining`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {budget === 0 && (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">No budget set yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Set a monthly budget above to start tracking</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default BudgetManager;
