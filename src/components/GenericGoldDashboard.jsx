import { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronRight, Clock, X, Calendar, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { acctGetPurchases, acctGetSales } from '../firebase/accountFirestore';
import GlowLoader from './GlowLoader';

const darken = (hex, amt = 40) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
};

export default function GenericGoldDashboard({ account, refreshTrigger }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [purchases,  setPurchases]  = useState([]);
  const [sales,      setSales]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [balVisible, setBalVisible] = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  const accent  = account.accent || '#f59e0b';
  const accentD = darken(accent, 35);

  useEffect(() => {
    if (!currentUser || !account?.id) return;
    setLoading(true);
    Promise.all([
      acctGetPurchases(currentUser.uid, account.id),
      acctGetSales(currentUser.uid, account.id),
    ]).then(([p, s]) => {
      setPurchases(p);
      setSales(s);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser, account?.id, refreshTrigger]);

  if (loading) return <GlowLoader label={`Loading ${account.name}...`} />;

  const totalInvested   = purchases.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalSold       = sales.reduce((s, s2) => s + parseFloat(s2.amount || 0), 0);
  const totalGoldBought = purchases.reduce((s, p) => s + parseFloat(p.grams || 0), 0);
  const totalGoldSold   = sales.reduce((s, s2) => s + parseFloat(s2.grams || 0), 0);
  const currentHolding  = totalGoldBought - totalGoldSold;
  const netValue        = totalSold - totalInvested;

  const all = [
    ...purchases.map(p => ({ ...p, txType: 'purchase' })),
    ...sales.map(s => ({ ...s, txType: 'sale' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const recent = (dateFilter ? all.filter(t => t.date?.startsWith(dateFilter)) : all).slice(0, 3);

  return (
    <div className="min-h-screen pb-6 animate-fade-in" style={{ background: '#f4f6f8' }}>

      {/* Header — STICKY with full accent gradient */}
      <div className="sticky top-0 z-40 relative px-5 pt-8 pb-24 overflow-hidden shadow-lg transition-shadow duration-300"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accentD})` }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white/60 text-xs font-medium mb-1">Gold Savings</p>
              <h1 className="text-white text-xl font-bold">{account.name}</h1>
            </div>
            <button onClick={() => navigate('/profile')}
              className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </div>

          {/* Balance card */}
          <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Gold Holdings</span>
              <button onClick={() => setBalVisible(!balVisible)}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-90 transition-transform">
                {balVisible ? <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
              </button>
            </div>
            <div className="mb-2">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Current Holding</p>
              <h2 className="text-gray-900 dark:text-white text-4xl font-black">
                {balVisible ? `${currentHolding.toFixed(3)}g` : '••••g'}
              </h2>
            </div>
            <p className={`text-sm font-semibold mb-6 ${netValue >= 0 ? '' : 'text-red-500'}`}
              style={netValue >= 0 ? { color: accent } : {}}>
              Net P&L: {netValue >= 0 ? '+' : ''}₹{netValue.toFixed(2)}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-2xl p-4 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accentD})` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">Invested</span>
                </div>
                <p className="text-white text-lg font-bold">₹{totalInvested.toFixed(2)}</p>
              </div>
              <div className="flex-1 rounded-2xl p-4 shadow-lg"
                style={{ background: `${accent}44` }}>
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
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H0V0Z" className="text-[#f4f6f8] dark:text-[#0a1929]" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-16 mb-6 relative z-10">
        <div className="flex gap-3">
          {[
            { label: 'Buy Gold',  path: `/account/${account.id}/buy`,     Icon: Plus         },
            { label: 'Sell Gold', path: `/account/${account.id}/sell`,    Icon: TrendingDown },
            { label: 'History',   path: `/account/${account.id}/history`, Icon: Clock        },
          ].map(({ label, path, Icon }) => (
            <button key={path} onClick={() => navigate(path)}
              className="touch-btn flex-1 rounded-2xl p-4 shadow-lg active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accentD})` }}>
              <Icon className="w-7 h-7 mb-2 text-white" />
              <p className="text-white text-sm font-bold">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm"
            style={{ border: `1px solid ${accent}22` }}>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Total Bought</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{totalGoldBought.toFixed(3)}g</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm"
            style={{ border: `1px solid ${accent}22` }}>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Total Sold</p>
            <p className="text-gray-900 dark:text-white text-lg font-bold">{totalGoldSold.toFixed(3)}g</p>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: accent }} />
            <h3 className="text-gray-900 dark:text-white text-base font-bold">Recent Activity</h3>
          </div>
          <button onClick={() => navigate(`/account/${account.id}/history`)}
            className="flex items-center gap-1 text-xs font-semibold active:scale-90 transition-transform" style={{ color: accent }}>
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none transition-colors"
            style={{ border: `2px solid ${accent}44` }} />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:scale-90 transition-transform">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {recent.length === 0 ? (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 text-center shadow-sm"
              style={{ border: `1px solid ${accent}22` }}>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No gold transactions yet</p>
            </div>
          ) : (
            recent.map((tx, i) => (
              <div key={i} onClick={() => setSelected(tx)}
                className="touch-card bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm cursor-pointer animate-slide-in active:scale-[0.99] transition-transform"
                style={{ border: `1px solid ${accent}22`, animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${accentD})` }}>
                    {tx.txType === 'purchase'
                      ? <TrendingUp className="w-6 h-6 text-white" />
                      : <TrendingDown className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
                      {tx.txType === 'purchase' ? 'Gold Purchase' : 'Gold Sale'}
                    </p>
                  </div>
                  <p className="text-base font-bold" style={{ color: accent }}>
                    {tx.txType === 'purchase' ? '−' : '+'} ₹{parseFloat(tx.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl max-w-sm w-full shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${accent}, ${accentD})` }} />
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-90 transition-transform">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Type',         selected.txType === 'purchase' ? 'Gold Purchase' : 'Gold Sale'],
                ['Amount',       `₹${parseFloat(selected.amount).toFixed(2)}`],
                ['Gold (grams)', `${parseFloat(selected.grams || 0).toFixed(3)}g`],
                ...(selected.rate  ? [['Rate/gram', `₹${parseFloat(selected.rate).toFixed(2)}`]] : []),
                ['Date',         new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                ...(selected.notes ? [['Notes', selected.notes]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium"
                    style={label === 'Amount' ? { color: accent } : {}}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
