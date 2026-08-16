import { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronRight, Clock, X, Calendar, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getGoldPurchases, getGoldSales } from '../firebase/firestore';

const GoldDashboard = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [p, s] = await Promise.all([
          getGoldPurchases(currentUser.uid),
          getGoldSales(currentUser.uid),
        ]);
        setPurchases(p);
        setSales(s);
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
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalInvested = purchases.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalSold = sales.reduce((s, s2) => s + parseFloat(s2.amount || 0), 0);
  const totalGoldBought = purchases.reduce((s, p) => s + parseFloat(p.grams || 0), 0);
  const totalGoldSold = sales.reduce((s, s2) => s + parseFloat(s2.grams || 0), 0);
  const currentHolding = totalGoldBought - totalGoldSold;
  const netValue = totalSold - totalInvested;

  const allTx = [
    ...purchases.map(p => ({ ...p, type: 'purchase' })),
    ...sales.map(s => ({ ...s, type: 'sale' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = dateFilter ? allTx.filter(t => t.date.startsWith(dateFilter)) : allTx;
  const recent = filtered.slice(0, 5);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929] pb-6 animate-fade-in">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-700 dark:to-yellow-800 px-5 pt-8 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-amber-100 text-xs font-medium mb-1">Gold Investment</p>
              <h1 className="text-white text-xl font-bold">Aura Gold</h1>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl animate-slide-in stagger-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Gold Holdings</span>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                {balanceVisible ? <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
              </button>
            </div>

            <div className="mb-2">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Current Holding</p>
              <h2 className="text-gray-900 dark:text-white text-4xl font-black">
                {balanceVisible ? `${currentHolding.toFixed(3)}g` : '••••g'}
              </h2>
            </div>
            <p className={`text-sm font-semibold mb-6 ${netValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              Net P&L: {netValue >= 0 ? '+' : ''}₹{netValue.toFixed(2)}
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-700 dark:to-yellow-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">Invested</span>
                </div>
                <p className="text-white text-lg font-bold">₹{totalInvested.toFixed(2)}</p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-yellow-300 to-amber-400 dark:from-yellow-700 dark:to-amber-700 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">Sold</span>
                </div>
                <p className="text-white text-lg font-bold">₹{totalSold.toFixed(2)}</p>
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
            onClick={() => navigate('/gold/buy')}
            className="touch-btn flex-1 bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-700 dark:to-yellow-800 rounded-2xl p-4 shadow-lg"
          >
            <Plus className="w-7 h-7 mb-2 text-white" />
            <p className="text-white text-sm font-bold">Buy Gold</p>
          </button>
          <button
            onClick={() => navigate('/gold/sell')}
            className="touch-btn flex-1 bg-gradient-to-br from-yellow-300 to-amber-400 dark:from-yellow-700 dark:to-amber-700 rounded-2xl p-4 shadow-lg"
          >
            <TrendingDown className="w-7 h-7 mb-2 text-white" />
            <p className="text-white text-sm font-bold">Sell Gold</p>
          </button>
          <button
            onClick={() => navigate('/gold/analytics')}
            className="touch-btn flex-1 bg-gradient-to-br from-orange-400 to-amber-500 dark:from-orange-700 dark:to-amber-700 rounded-2xl p-4 shadow-lg"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 mb-2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <p className="text-white text-sm font-bold">Analytics</p>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Total Bought</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{totalGoldBought.toFixed(3)}g</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Total Sold</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{totalGoldSold.toFixed(3)}g</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-gray-900 dark:text-white text-base font-bold">Recent Activity</h3>
          </div>
          <button
            onClick={() => navigate('/gold/history')}
            className="flex items-center gap-1 text-amber-500 text-xs font-semibold"
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
            className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white"
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
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No gold transactions yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Start by buying gold</p>
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
                    tx.type === 'purchase'
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-700 dark:to-yellow-800'
                      : 'bg-gradient-to-br from-yellow-300 to-amber-400 dark:from-yellow-700 dark:to-amber-700'
                  }`}>
                    {tx.type === 'purchase'
                      ? <TrendingUp className="w-6 h-6 text-white" />
                      : <TrendingDown className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
                      {tx.type === 'purchase' ? 'Gold Purchase' : 'Gold Sale'} — {parseFloat(tx.grams || 0).toFixed(3)}g
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {tx.rate ? ` · ₹${parseFloat(tx.rate).toFixed(0)}/g` : ''}
                    </p>
                  </div>
                  <p className={`text-base font-bold ${tx.type === 'purchase' ? 'text-amber-500' : 'text-yellow-600 dark:text-amber-400'}`}>
                    {tx.type === 'purchase' ? '−' : '+'} ₹{parseFloat(tx.amount).toFixed(2)}
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
                    ['Type', selectedTx.type === 'purchase' ? 'Gold Purchase' : 'Gold Sale'],
                    ['Amount', `₹${parseFloat(selectedTx.amount).toFixed(2)}`],
                    ['Gold (grams)', `${parseFloat(selectedTx.grams || 0).toFixed(3)}g`],
                    ...(selectedTx.rate ? [['Rate/gram', `₹${parseFloat(selectedTx.rate).toFixed(2)}`]] : []),
                    ['Date', new Date(selectedTx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
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

export default GoldDashboard;
