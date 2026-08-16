import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PieChart as PieIcon, BarChart3, ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { acctGetIncome, acctGetExpenses } from '../firebase/accountFirestore';
import { useAccounts } from '../context/AccountsContext';
import GlowLoader from './GlowLoader';

const CAT_COLORS = {
  Food: '#f97316', Travel: '#3b82f6', Shopping: '#ec4899',
  Bills: '#eab308', Entertainment: '#8b5cf6', Education: '#10b981',
  Health: '#ef4444', Others: '#94a3b8',
};
const COLORS = ['#f97316','#3b82f6','#ec4899','#eab308','#8b5cf6','#10b981','#ef4444','#94a3b8'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function GenericAnalytics() {
  const { currentUser } = useAuth();
  const { accountId } = useParams();
  const { accounts } = useAccounts();
  const navigate = useNavigate();

  const account = accounts.find(a => a.id === accountId);
  const accent = account?.accent || '#4a9eff';

  const [expenses, setExpenses] = useState([]);
  const [income,   setIncome]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  useEffect(() => {
    if (!currentUser || !accountId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      acctGetIncome(currentUser.uid, accountId),
      acctGetExpenses(currentUser.uid, accountId),
    ]).then(([inc, exp]) => {
      setIncome(inc || []);
      setExpenses(exp || []);
    }).catch(() => { setIncome([]); setExpenses([]); })
      .finally(() => setLoading(false));
  }, [currentUser, accountId]);

  if (loading) return <GlowLoader label="Crunching numbers..." />;

  // ── All-time totals ──────────────────────────────────────────────────────────
  const totalInc = income.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalExp = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const savings  = totalInc - totalExp;

  // ── All-time category breakdown ──────────────────────────────────────────────
  const catData = expenses.reduce((acc, e) => {
    const x = acc.find(i => i.name === e.category);
    if (x) x.value += parseFloat(e.amount || 0);
    else acc.push({ name: e.category || 'Others', value: parseFloat(e.amount || 0) });
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // ── Selected-month data ──────────────────────────────────────────────────────
  const mExp = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; });
  const mInc = income.filter(i  => { const d = new Date(i.date);  return d.getMonth() === month && d.getFullYear() === year; });
  const mTotalExp = mExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const mTotalInc = mInc.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const mCatData  = mExp.reduce((acc, e) => {
    const x = acc.find(i => i.name === e.category);
    if (x) x.value += parseFloat(e.amount || 0);
    else acc.push({ name: e.category || 'Others', value: parseFloat(e.amount || 0) });
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // ── Monthly trend (bar chart) ────────────────────────────────────────────────
  const monthlyData = expenses.reduce((acc, e) => {
    const m = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const x = acc.find(i => i.m === m);
    if (x) x.expenses += parseFloat(e.amount || 0);
    else acc.push({ m, expenses: parseFloat(e.amount || 0), income: 0 });
    return acc;
  }, []);
  income.forEach(i => {
    const m = new Date(i.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const x = monthlyData.find(d => d.m === m);
    if (x) x.income += parseFloat(i.amount || 0);
    else monthlyData.push({ m, expenses: 0, income: parseFloat(i.amount || 0) });
  });
  monthlyData.sort((a, b) => new Date('1 ' + a.m) - new Date('1 ' + b.m));

  const fmtINR = v => `₹${parseFloat(v).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117] pb-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-12 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}ee, ${accent}99)` }}>
        <div className="absolute top-2 right-6 w-20 h-20 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 left-8 w-14 h-14 bg-white/8 rounded-full" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(`/account/${accountId}`)}
            className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Analytics</h1>
            <p className="text-white/70 text-xs">{account?.name || 'Account'} · Spending insights</p>
          </div>
          <Sparkles className="ml-auto w-5 h-5 text-white/60 animate-pulse" />
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-3">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { Icon: TrendingUp,   label: 'Income', value: fmtINR(totalInc), color: '#10b981' },
            { Icon: TrendingDown, label: 'Spent',  value: fmtINR(totalExp), color: '#f43f5e' },
            { Icon: Wallet,       label: 'Saved',  value: fmtINR(Math.abs(savings)), color: savings >= 0 ? '#38bdf8' : '#fb923c' },
          ].map(({ Icon, label, value, color }, i) => (
            <div key={label} className="bg-white dark:bg-[#161d27] rounded-xl p-3 border border-[#e8ecf0] dark:border-[#1e2a38] animate-card-in"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5"
                style={{ background: `${color}22` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest">{label}</p>
              <p className="text-sm font-black text-[#1a2332] dark:text-white leading-tight mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Monthly breakdown ── */}
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in" style={{ animationDelay: '0.1s' }}>
          <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}66)` }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}22` }}>
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
                <p className="text-xs font-bold text-[#1a2332] dark:text-[#c8d8e8]">Monthly Breakdown</p>
              </div>
              <div className="flex items-center gap-1 bg-[#f4f6f8] dark:bg-[#0d1117] rounded-xl px-2 py-1">
                <button onClick={prevMonth} className="p-0.5 rounded-lg active:scale-90 transition-transform">
                  <ChevronLeft className="w-4 h-4 text-[#6b7a8d]" />
                </button>
                <span className="text-xs font-bold text-[#2d3748] dark:text-[#c8d8e8] min-w-[72px] text-center">
                  {MONTHS[month]} {year}
                </span>
                <button onClick={nextMonth} className="p-0.5 rounded-lg active:scale-90 transition-transform">
                  <ChevronRight className="w-4 h-4 text-[#6b7a8d]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#f0fdf4] dark:bg-[#1a3a2a] rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-[#8a9bb0] font-medium">Income</p>
                <p className="text-sm font-black text-[#4ade80]">{fmtINR(mTotalInc)}</p>
              </div>
              <div className="bg-[#fff5f5] dark:bg-[#3a1a1a] rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-[#8a9bb0] font-medium">Spent</p>
                <p className="text-sm font-black text-[#f87171]">{fmtINR(mTotalExp)}</p>
              </div>
            </div>

            {mCatData.length > 0 ? (
              <div className="space-y-2">
                {mCatData.map((item, i) => {
                  const pct   = mTotalExp > 0 ? (item.value / mTotalExp) * 100 : 0;
                  const color = CAT_COLORS[item.name] || COLORS[i % COLORS.length];
                  return (
                    <div key={item.name} className="animate-card-in" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#8a9bb0]">{pct.toFixed(0)}%</span>
                          <span className="text-xs font-bold text-[#1a2332] dark:text-white">{fmtINR(item.value)}</span>
                        </div>
                      </div>
                      <div className="bg-[#f4f6f8] dark:bg-[#0d1117] rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-[#8a9bb0]">No expenses for {MONTHS[month]} {year}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pie chart — all-time category split ── */}
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in" style={{ animationDelay: '0.15s' }}>
          <div className="h-0.5 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <PieIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1a2332] dark:text-[#c8d8e8]">Category Split</p>
                <p className="text-[10px] text-[#8a9bb0]">All-time distribution</p>
              </div>
            </div>
            {catData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                      label={({ percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                      labelLine={false}>
                      {catData.map((e, i) => (
                        <Cell key={i} fill={CAT_COLORS[e.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => fmtINR(v)}
                      contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {catData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CAT_COLORS[item.name] || COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-[#6b7a8d] dark:text-[#8a9bb0] truncate">{item.name}</span>
                      <span className="text-[10px] font-bold text-[#1a2332] dark:text-[#c8d8e8] ml-auto">{fmtINR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-[#8a9bb0]">No expense data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Bar chart — monthly trend ── */}
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in" style={{ animationDelay: '0.2s' }}>
          <div className="h-0.5 bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1a2332] dark:text-[#c8d8e8]">Monthly Trend</p>
                <p className="text-[10px] text-[#8a9bb0]">Income vs Expenses</p>
              </div>
              <div className="ml-auto flex gap-1.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#f0fdf4] dark:bg-[#1a3a2a] text-[#4ade80]">Income</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#fff5f5] dark:bg-[#3a1a1a] text-[#f87171]">Spent</span>
              </div>
            </div>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} barSize={10} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={v => fmtINR(v)}
                    contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="income"   fill="#4ade80" name="Income"   radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f87171" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-[#8a9bb0]">No monthly data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Insights ── */}
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in" style={{ animationDelay: '0.25s' }}>
          <div className="h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-bold text-[#1a2332] dark:text-[#c8d8e8]">Insights</p>
            </div>
            <div className="space-y-2">
              {catData.length > 0 && (
                <div className="bg-[#f4f6f8] dark:bg-[#0d1117] rounded-xl p-2.5">
                  <p className="text-xs text-[#2d3748] dark:text-[#c8d8e8]">
                    Top spend: <span className="font-bold text-amber-500">{catData[0]?.name}</span> — {fmtINR(catData[0]?.value)}
                  </p>
                </div>
              )}
              {savings > 0 && (
                <div className="bg-[#f4f6f8] dark:bg-[#0d1117] rounded-xl p-2.5">
                  <p className="text-xs text-[#2d3748] dark:text-[#c8d8e8]">
                    Saving <span className="font-bold text-[#4ade80]">{((savings / totalInc) * 100).toFixed(1)}%</span> of income
                  </p>
                </div>
              )}
              {savings < 0 && (
                <div className="bg-[#fff5f5] dark:bg-[#3a1a1a] rounded-xl p-2.5">
                  <p className="text-xs text-[#2d3748] dark:text-[#c8d8e8]">
                    Expenses exceed income by <span className="font-bold text-[#f87171]">{fmtINR(Math.abs(savings))}</span>
                  </p>
                </div>
              )}
              <div className="bg-[#f4f6f8] dark:bg-[#0d1117] rounded-xl p-2.5">
                <p className="text-xs text-[#2d3748] dark:text-[#c8d8e8]">
                  <span className="font-bold" style={{ color: accent }}>{expenses.length}</span> transactions across{' '}
                  <span className="font-bold" style={{ color: accent }}>{catData.length}</span> categories
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
