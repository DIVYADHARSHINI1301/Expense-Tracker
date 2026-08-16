import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getGoldPurchases, getGoldSales } from '../firebase/firestore';

const GoldAnalytics = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [p, s] = await Promise.all([getGoldPurchases(currentUser.uid), getGoldSales(currentUser.uid)]);
        setPurchases(p || []);
        setSales(s || []);
      } catch { setPurchases([]); setSales([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [currentUser]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a1929]">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalInvested = purchases.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalSold = sales.reduce((s, s2) => s + parseFloat(s2.amount || 0), 0);
  const totalGoldBought = purchases.reduce((s, p) => s + parseFloat(p.grams || 0), 0);
  const totalGoldSold = sales.reduce((s, s2) => s + parseFloat(s2.grams || 0), 0);
  const currentHolding = totalGoldBought - totalGoldSold;
  const netPL = totalSold - totalInvested;

  // Monthly data
  const monthlyMap = {};
  purchases.forEach(p => {
    const key = new Date(p.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, invested: 0, received: 0, bought: 0, sold: 0 };
    monthlyMap[key].invested += parseFloat(p.amount || 0);
    monthlyMap[key].bought += parseFloat(p.grams || 0);
  });
  sales.forEach(s => {
    const key = new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, invested: 0, received: 0, bought: 0, sold: 0 };
    monthlyMap[key].received += parseFloat(s.amount || 0);
    monthlyMap[key].sold += parseFloat(s.grams || 0);
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => new Date(a.month) - new Date(b.month));

  // Cumulative holding over time
  const allEvents = [
    ...purchases.map(p => ({ date: p.date, grams: parseFloat(p.grams || 0), type: 'buy' })),
    ...sales.map(s => ({ date: s.date, grams: parseFloat(s.grams || 0), type: 'sell' })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let running = 0;
  const holdingData = allEvents.map(e => {
    running += e.type === 'buy' ? e.grams : -e.grams;
    return {
      date: new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      holding: parseFloat(running.toFixed(3)),
    };
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929] pb-20 animate-fade-in">
      <div className="relative bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-700 dark:to-yellow-800 px-5 pt-8 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/gold')} className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Gold Analytics</h1>
            <p className="text-amber-100 text-xs">Investment insights</p>
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
        <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-in stagger-1">
          {[
            { label: 'Total Invested', value: `₹${totalInvested.toFixed(0)}`, grad: 'from-amber-400 to-yellow-500', icon: <TrendingUp className="w-4 h-4 text-white" /> },
            { label: 'Total Received', value: `₹${totalSold.toFixed(0)}`, grad: 'from-yellow-300 to-amber-400', icon: <TrendingDown className="w-4 h-4 text-white" /> },
            { label: 'Gold Bought', value: `${totalGoldBought.toFixed(3)}g`, grad: 'from-orange-400 to-amber-500', icon: <BarChart3 className="w-4 h-4 text-white" /> },
            { label: 'Current Holding', value: `${currentHolding.toFixed(3)}g`, grad: 'from-amber-500 to-orange-500', icon: <BarChart3 className="w-4 h-4 text-white" /> },
          ].map(({ label, value, grad, icon }) => (
            <div key={label} className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-2`}>{icon}</div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">{label}</p>
              <p className="text-gray-900 dark:text-white text-sm font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Net P&L */}
        <div className={`rounded-2xl p-5 mb-4 shadow-sm border animate-slide-in stagger-2 ${netPL >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Net Profit / Loss</p>
          <p className={`text-3xl font-black ${netPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {netPL >= 0 ? '+' : ''}₹{netPL.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on sold gold only</p>
        </div>

        {/* Monthly Bar Chart */}
        {monthlyData.length > 0 && (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4 animate-slide-in stagger-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-gray-900 dark:text-white text-base font-bold">Monthly Activity</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip formatter={v => `₹${v.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="invested" fill="#f59e0b" name="Invested" radius={[4,4,0,0]} />
                <Bar dataKey="received" fill="#fcd34d" name="Received" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Holding Timeline */}
        {holdingData.length > 1 && (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4 animate-slide-in stagger-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-gray-900 dark:text-white text-base font-bold">Gold Holding Over Time</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={holdingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="g" />
                <Tooltip formatter={v => `${v}g`} />
                <Line type="monotone" dataKey="holding" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} name="Holding (g)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {purchases.length === 0 && sales.length === 0 && (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No gold data yet. Start by recording a purchase.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldAnalytics;
