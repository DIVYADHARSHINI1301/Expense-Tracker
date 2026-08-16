import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Trash2, Calendar, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounts } from '../context/AccountsContext';
import { acctGetPurchases, acctGetSales, acctDeletePurchase, acctDeleteSale } from '../firebase/accountFirestore';
import GlowLoader from './GlowLoader';
import toast from 'react-hot-toast';

export default function AccountGoldHistory({ onUpdate }) {
  const { accountId } = useParams();
  const { currentUser } = useAuth();
  const { accounts } = useAccounts();
  const navigate = useNavigate();

  const account = accounts.find(a => a.id === accountId);
  const accent  = account?.accent || '#f59e0b';

  const [all, setAll]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchAll = async () => {
    if (!currentUser || !accountId) return;
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        acctGetPurchases(currentUser.uid, accountId),
        acctGetSales(currentUser.uid, accountId),
      ]);
      setAll([
        ...p.map(x => ({ ...x, txType: 'purchase' })),
        ...s.map(x => ({ ...x, txType: 'sale' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [currentUser, accountId]);

  const handleDelete = async (tx) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      if (tx.txType === 'purchase') await acctDeletePurchase(currentUser.uid, accountId, tx.id);
      else await acctDeleteSale(currentUser.uid, accountId, tx.id);
      setAll(prev => prev.filter(t => t.id !== tx.id));
      toast.success('Deleted'); onUpdate?.();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <GlowLoader label="Loading gold history..." />;

  const filtered = all.filter(t => {
    const matchDate = !dateFilter || t.date?.startsWith(dateFilter);
    const matchType = typeFilter === 'all' || t.txType === typeFilter;
    return matchDate && matchType;
  });

  const totalBought = all.filter(t => t.txType === 'purchase').reduce((s, t) => s + parseFloat(t.grams || 0), 0);
  const totalSold   = all.filter(t => t.txType === 'sale').reduce((s, t) => s + parseFloat(t.grams || 0), 0);

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117]">
      <div className="bg-[#1a2332] dark:bg-[#0d1117] px-4 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/account/${accountId}`)}
            className="w-8 h-8 rounded-xl bg-[#2a3a4e] flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-[#8a9bb0]" />
          </button>
          <div>
            <h1 className="text-white text-base font-bold">Gold History</h1>
            <p className="text-[#8a9bb0] text-xs">{account?.name || 'Gold Account'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-6">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#1a2332] rounded-xl p-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: accent }} />
            <div>
              <p className="text-[#8a9bb0] text-[9px] uppercase tracking-wider">Bought</p>
              <p className="text-white text-xs font-black">{totalBought.toFixed(3)}g</p>
            </div>
          </div>
          <div className="bg-[#1a2332] rounded-xl p-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#f87171]" />
            <div>
              <p className="text-[#8a9bb0] text-[9px] uppercase tracking-wider">Sold</p>
              <p className="text-white text-xs font-black">{totalSold.toFixed(3)}g</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] p-3 space-y-2">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3 h-3" />
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="w-full pl-7 pr-8 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none" />
            {dateFilter && <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-[#8a9bb0]" /></button>}
          </div>
          <div className="flex gap-1">
            {['all', 'purchase', 'sale'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${typeFilter === t ? 'text-white' : 'bg-[#f8fafc] dark:bg-[#1a2332] text-[#8a9bb0] border border-[#e8ecf0] dark:border-[#1e2a38]'}`}
                style={typeFilter === t ? { backgroundColor: accent } : {}}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#161d27] rounded-xl p-8 text-center border border-[#e8ecf0] dark:border-[#1e2a38]">
              <p className="text-sm font-semibold text-[#6b7a8d]">No records found</p>
            </div>
          ) : (
            filtered.map((t, i) => (
              <div key={t.id} className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] p-3 flex items-center gap-3 animate-card-in" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}22` }}>
                  {t.txType === 'purchase'
                    ? <TrendingUp className="w-4 h-4" style={{ color: accent }} />
                    : <TrendingDown className="w-4 h-4 text-[#f87171]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8]">
                    {t.txType === 'purchase' ? 'Bought' : 'Sold'} {parseFloat(t.grams || 0).toFixed(3)}g
                  </p>
                  <p className="text-[10px] text-[#8a9bb0]">
                    {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {t.rate ? ` · ₹${parseFloat(t.rate).toFixed(0)}/g` : ''}
                  </p>
                </div>
                <p className={`text-sm font-black flex-shrink-0 ${t.txType === 'purchase' ? '' : 'text-[#4ade80]'}`} style={t.txType === 'purchase' ? { color: accent } : {}}>
                  {t.txType === 'purchase' ? '−' : '+'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                </p>
                <button onClick={() => handleDelete(t)} className="w-7 h-7 rounded-lg bg-[#fff5f5] dark:bg-[#3a1a1a] flex items-center justify-center text-[#f87171] active:scale-90 transition-transform flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
