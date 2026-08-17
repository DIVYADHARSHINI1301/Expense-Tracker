import { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounts } from '../context/AccountsContext';
import { acctGetExpenses } from '../firebase/accountFirestore';
import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import GlowLoader from './GlowLoader';

// Per-account budget stored at: users/{uid}/accounts/{accountId}/settings
const getBudget = async (uid, accountId) => {
  const q = query(
    collection(db, 'users', uid, 'accounts', accountId, 'settings'),
    where('type', '==', 'budget')
  );
  const snap = await getDocs(q);
  return snap.empty ? 0 : (snap.docs[0].data().amount || 0);
};

const saveBudget = async (uid, accountId, amount) => {
  const col = collection(db, 'users', uid, 'accounts', accountId, 'settings');
  const q   = query(col, where('type', '==', 'budget'));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(col, { type: 'budget', amount, updatedAt: serverTimestamp() });
  } else {
    await updateDoc(doc(db, 'users', uid, 'accounts', accountId, 'settings', snap.docs[0].id), {
      amount, updatedAt: serverTimestamp(),
    });
  }
};

export default function GenericBudget({ onUpdate }) {
  const { currentUser } = useAuth();
  const { accountId }   = useParams();
  const { accounts }    = useAccounts();
  const navigate        = useNavigate();

  const account = accounts.find(a => a.id === accountId);
  const accent  = account?.accent || '#4a9eff';

  const [budget,        setBudget]        = useState(0);
  const [inputValue,    setInputValue]    = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => {
    if (!currentUser || !accountId) return;
    setLoading(true);
    Promise.all([
      getBudget(currentUser.uid, accountId),
      acctGetExpenses(currentUser.uid, accountId),
    ]).then(([b, exp]) => {
      setBudget(b);
      setInputValue(b || '');
      setTotalExpenses(exp.reduce((s, e) => s + parseFloat(e.amount || 0), 0));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser, accountId]);

  const budgetUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const remaining  = budget - totalExpenses;
  const isOver     = remaining < 0;
  const isWarning  = !isOver && budget > 0 && remaining < budget * 0.2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(inputValue);
    if (!val || val <= 0) { toast.error('Enter a valid budget amount'); return; }
    setSubmitting(true);
    try {
      await saveBudget(currentUser.uid, accountId, val);
      setBudget(val);
      toast.success('🎯 Budget updated!');
      onUpdate?.();
    } catch { toast.error('Failed to update budget'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <GlowLoader label="Loading budget..." />;

  const statusColor = isOver ? '#f87171' : isWarning ? '#fbbf24' : accent;
  const statusBg    = isOver ? 'bg-[#fff5f5] dark:bg-[#3a1a1a]' : isWarning ? 'bg-[#fffbeb] dark:bg-[#2a1a00]' : 'bg-[#f0f9ff] dark:bg-[#0d1a2a]';

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117] flex flex-col">

      {/* Header - STICKY */}
      <div className="sticky top-0 z-40 relative px-4 pt-6 pb-12 overflow-hidden shadow-lg transition-shadow duration-300"
        style={{ background: `linear-gradient(135deg, ${accent}ee, ${accent}99)` }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(`/account/${accountId}`)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Budget</h1>
            <p className="text-white/70 text-xs">{account?.name} · Monthly spending limit</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 5C120 10 240 20 360 23.3C480 27 600 23 720 21.7C840 20 960 20 1080 23.3C1200 27 1320 33 1380 36.7L1440 40V60H0V0Z"
              fill="currentColor" className="text-[#f4f6f8] dark:text-[#0d1117]" />
          </svg>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 space-y-3 pb-32">

          {/* Set Budget */}
          <div className="bg-white dark:bg-[#161d27] rounded-2xl p-5 border border-[#e8ecf0] dark:border-[#1e2a38] animate-card-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}22` }}>
                <Target className="w-5 h-5" style={{ color: accent }} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1a2332] dark:text-white">Set Monthly Budget</h2>
                <p className="text-xs text-[#8a9bb0]">Control your spending limit</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9bb0] font-bold text-base">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="w-full pl-9 pr-4 py-3.5 rounded-xl border-2 border-[#e8ecf0] dark:border-[#1e2a38] bg-[#f4f6f8] dark:bg-[#0d1117] text-[#1a2332] dark:text-white text-base font-semibold focus:border-transparent focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': accent }}
                />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</>
                  : '🎯 Update Budget'}
              </button>
            </form>

            {budget > 0 && (
              <div className="mt-3 p-3 rounded-xl text-center" style={{ background: `${accent}15`, border: `1px solid ${accent}33` }}>
                <p className="text-xs font-bold" style={{ color: accent }}>
                  Current Budget: ₹{budget.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>

          {/* Progress */}
          {budget > 0 && (
            <div className="bg-white dark:bg-[#161d27] rounded-2xl p-5 border border-[#e8ecf0] dark:border-[#1e2a38] animate-card-in" style={{ animationDelay: '0.06s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1a2332] dark:text-white">Budget Progress</h3>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: `${statusColor}18`, color: statusColor }}>
                  {budgetUsed.toFixed(1)}% used
                </span>
              </div>

              {/* Bar */}
              <div className="w-full bg-[#f4f6f8] dark:bg-[#0d1117] rounded-full h-3 mb-4 overflow-hidden">
                <div className="h-3 rounded-full transition-all duration-700 progress-animated"
                  style={{ width: `${Math.min(budgetUsed, 100)}%`, background: `linear-gradient(90deg, ${statusColor}cc, ${statusColor})` }} />
              </div>

              {/* Budget vs Spent */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl p-3.5 border" style={{ background: `${accent}10`, borderColor: `${accent}30` }}>
                  <p className="text-[10px] font-semibold text-[#8a9bb0] mb-1">Budget</p>
                  <p className="text-lg font-black" style={{ color: accent }}>₹{budget.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl p-3.5 border bg-[#fff5f5] dark:bg-[#3a1a1a] border-[#fecaca] dark:border-[#7f1d1d]">
                  <p className="text-[10px] font-semibold text-[#8a9bb0] mb-1">Spent</p>
                  <p className="text-lg font-black text-[#f87171]">₹{totalExpenses.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Status */}
              <div className={`rounded-xl p-4 border ${statusBg}`}
                style={{ borderColor: `${statusColor}33` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${statusColor}20` }}>
                    {isOver
                      ? <AlertTriangle className="w-5 h-5" style={{ color: statusColor }} />
                      : <TrendingUp className="w-5 h-5" style={{ color: statusColor }} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: statusColor }}>
                      {isOver ? 'Budget Exceeded!' : isWarning ? 'Almost at limit' : 'On Track 🎉'}
                    </p>
                    <p className="text-[#8a9bb0] text-xs mt-0.5">
                      {isOver
                        ? `Over by ₹${Math.abs(remaining).toLocaleString('en-IN')}`
                        : `₹${remaining.toLocaleString('en-IN')} remaining`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {budget === 0 && (
            <div className="bg-white dark:bg-[#161d27] rounded-2xl p-10 text-center border border-[#e8ecf0] dark:border-[#1e2a38] animate-card-in" style={{ animationDelay: '0.06s' }}>
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-[#2d3748] dark:text-[#c8d8e8] font-semibold text-sm">No budget set yet</p>
              <p className="text-[#8a9bb0] text-xs mt-1">Set a monthly budget above to start tracking</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
