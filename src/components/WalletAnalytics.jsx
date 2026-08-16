import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWalletExpenses, getWalletIncome } from '../firebase/firestore';

const COLORS = ['#8b5cf6','#a78bfa','#7c3aed','#6d28d9','#c4b5fd','#ddd6fe','#ede9fe'];
const CATEGORY_COLORS = {
  Food: '#f97316', Travel: '#3b82f6', Shopping: '#ec4899',
  Bills: '#eab308', Entertainment: '#8b5cf6', Education: '#22c55e',
  Health: '#ef4444', Others: '#94a3b8',
};

const WalletAnalytics = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const prevMonth = () => { if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1); } else setSelMonth(m => m - 1); };
  const nextMonth = () => { if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1); } else setSelMonth(m => m + 1); };

  useEffect(() => {
    const fetch = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [exp, inc] = await Promise.all([getWalletExpenses(currentUser.uid), getWalletIncome(currentUser.uid)]);
        setExpenses(exp || []);
        setIncome(inc || []);
      } catch { setExpenses([]); setIncome([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [currentUser]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a1929]">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalIncome = income.reduce((s, i) => s + parseFloat(i.amount), 0);

  const categoryData = expenses.reduce((acc, exp) => {
    const ex = acc.find(i => i.name === exp.category);
    if (ex) ex.value += parseFloat(exp.amount);
    else acc.push({ name: exp.category, value: parseFloat(exp.amount) });
    return acc;
  }, []);

  const monthlyExpenses = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; });
  const monthlyIncome = income.filter(i => { const d = new Date(i.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; });
  const monthlyCatData = monthlyExpenses.reduce((acc, exp) => {
    const ex = acc.find(i => i.name === exp.category);
    if (ex) ex.value += parseFloat(exp.amount);
    else acc.push({ name: exp.category, value: parseFloat(exp.amount) });
    return acc;
  }, []).sort((a, b) => b.value - a.value);
  const monthTotalExp = monthlyExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const monthTotalInc = monthlyIncome.reduce((s, i) => s + parseFloat(i.amount), 0);

  const monthlyData = expenses.reduce((acc, exp) => {
    const month = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const ex = acc.find(i => i.month === month);
    if (ex) ex.expenses += parseFloat(exp.amount);
    else acc.push({ month, expenses: parseFloat(exp.amount), income: 0 });
    return acc;
  }, []);
  income.forEach(inc => {
    const month = new Date(inc.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const ex = monthlyData.find(i => i.month === month);
    if (ex) ex.income += parseFloat(inc.amount);
    else monthlyData.push({ month, expenses: 0, income: parseFloat(inc.amount) });
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929] pb-20 animate-fade-in">
      <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-800 dark:to-purple-900 px-5 pt-8 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/wallet')} className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Wallet Analytics</h1>
            <p className="text-violet-100 text-xs">Cash flow insights</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 5C120 10 240 20 360 23.3C480 27 600 23 720 21.7C840 20 960 20 1080 23.3C1200 27 1320 33 1380 36.7L1440 40V60H0V0Z" fill="currentColor" className="text-white dark:text-[#0a1929]"/>
          </svg>
        </div>
      </div>

      <div className="px-5 -mt-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-in stagger-1">
          {[
            { label: 'Income', value: totalIncome, icon: <TrendingUp className="w-4 h-4 text-white" />, grad: 'from-violet-500 to-purple-600' },
            { label: 'Expenses', value: totalExpenses, icon: <PieIcon className="w-4 h-4 text-white" />, grad: 'from-purple-400 to-violet-500' },
            { label: 'Savings', value: totalIncome - totalExpenses, icon: <BarChart3 className="w-4 h-4 text-white" />, grad: 'from-fuchsia-500 to-purple-600', colored: true },
          ].map(({ label, value, icon, grad, colored }) => (
            <div key={label} className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mx-auto mb-2`}>{icon}</div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">{label}</p>
              <p className={`text-sm font-bold ${colored ? (value >= 0 ? 'text-violet-500' : 'text-red-500') : 'text-gray-900 dark:text-white'}`}>₹{value.toFixed(0)}</p>
            </div>
          ))}
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4 animate-slide-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 dark:text-white text-base font-bold">Monthly Breakdown</h2>
          </div>
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 mb-4">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <span className="font-bold text-gray-800 dark:text-white text-sm">{MONTHS[selMonth]} {selYear}</span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Income</p>
              <p className="text-base font-bold text-violet-600 dark:text-violet-300">₹{monthTotalInc.toFixed(0)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Spent</p>
              <p className="text-base font-bold text-red-500">₹{monthTotalExp.toFixed(0)}</p>
            </div>
          </div>
          {monthlyCatData.length > 0 ? (
            <div className="space-y-2 mt-4">
              {monthlyCatData.map((item, idx) => {
                const pct = monthTotalExp > 0 ? (item.value / monthTotalExp) * 100 : 0;
                const color = CATEGORY_COLORS[item.name] || COLORS[idx % COLORS.length];
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">₹{item.value.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No expenses for {MONTHS[selMonth]} {selYear}</p>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        {categoryData.length > 0 && (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4 animate-slide-in stagger-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <PieIcon className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-gray-900 dark:text-white text-base font-bold">Category Spending</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80} dataKey="value">
                  {categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={CATEGORY_COLORS[entry.name] || COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `₹${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart */}
        {monthlyData.length > 0 && (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4 animate-slide-in stagger-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-gray-900 dark:text-white text-base font-bold">Monthly Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip formatter={v => `₹${v.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="income" fill="#8b5cf6" name="Income" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" fill="#a78bfa" name="Expenses" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletAnalytics;
