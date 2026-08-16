import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, TrendingDown, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getExpenses, getIncome } from '../firebase/firestore';
import GlowLoader from './GlowLoader';

const CAT_COLORS = {
  Food:'#f97316', Travel:'#3b82f6', Shopping:'#ec4899',
  Bills:'#eab308', Entertainment:'#8b5cf6', Education:'#10b981',
  Health:'#ef4444', Others:'#94a3b8'
};
const COLORS = ['#f97316','#3b82f6','#ec4899','#eab308','#8b5cf6','#10b981','#ef4444','#94a3b8'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ icon:Icon, label, value, grad, glow, delay=0 }) => (
  <div className={`neu rounded-xl p-3 animate-card-in flex flex-col gap-1.5 bg-[#e8f4fd] dark:bg-[#0f2236] ${glow}`}
    style={{ animationDelay:`${delay}s` }}>
    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
      <Icon className="w-3.5 h-3.5 text-white" />
    </div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-black text-gray-900 dark:text-white leading-tight animate-count-up">{value}</p>
  </div>
);

export default function Analytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());

  const prevMonth = () => { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  useEffect(() => {
    (async () => {
      if (!currentUser) { setLoading(false); return; }
      setLoading(true);
      try {
        const [e,i] = await Promise.all([getExpenses(currentUser.uid), getIncome(currentUser.uid)]);
        setExpenses(e||[]); setIncome(i||[]);
      } catch { setExpenses([]); setIncome([]); }
      finally { setLoading(false); }
    })();
  }, [currentUser]);

  if (loading) return <GlowLoader label="Crunching numbers..." />;

  const totalExp = expenses.reduce((s,e) => s+parseFloat(e.amount), 0);
  const totalInc = income.reduce((s,i) => s+parseFloat(i.amount), 0);
  const savings  = totalInc - totalExp;

  const catData = expenses.reduce((acc,e) => {
    const x = acc.find(i=>i.name===e.category);
    if(x) x.value+=parseFloat(e.amount); else acc.push({name:e.category,value:parseFloat(e.amount)});
    return acc;
  },[]).sort((a,b)=>b.value-a.value);

  const mExp = expenses.filter(e => { const d=new Date(e.date); return d.getMonth()===month&&d.getFullYear()===year; });
  const mInc = income.filter(i  => { const d=new Date(i.date);  return d.getMonth()===month&&d.getFullYear()===year; });
  const mCatData = mExp.reduce((acc,e) => {
    const x=acc.find(i=>i.name===e.category);
    if(x) x.value+=parseFloat(e.amount); else acc.push({name:e.category,value:parseFloat(e.amount)});
    return acc;
  },[]).sort((a,b)=>b.value-a.value);
  const mTotalExp = mExp.reduce((s,e)=>s+parseFloat(e.amount),0);
  const mTotalInc = mInc.reduce((s,i)=>s+parseFloat(i.amount),0);

  const monthlyData = expenses.reduce((acc,e) => {
    const m = new Date(e.date).toLocaleDateString('en-US',{month:'short',year:'2-digit'});
    const x = acc.find(i=>i.m===m);
    if(x) x.expenses+=parseFloat(e.amount); else acc.push({m,expenses:parseFloat(e.amount),income:0});
    return acc;
  },[]);
  income.forEach(i => {
    const m = new Date(i.date).toLocaleDateString('en-US',{month:'short',year:'2-digit'});
    const x = monthlyData.find(d=>d.m===m);
    if(x) x.income+=parseFloat(i.amount); else monthlyData.push({m,expenses:0,income:parseFloat(i.amount)});
  });

  return (
    <div className="min-h-screen bg-[#e8f4fd] dark:bg-[#060f1a] pb-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-900 px-4 pt-5 pb-12 overflow-hidden">
        <div className="absolute top-2 right-6 w-20 h-20 bg-white/10 rounded-full animate-float" />
        <div className="absolute -bottom-4 left-8 w-14 h-14 bg-white/8 rounded-full animate-float" style={{animationDelay:'0.8s'}} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="touch-btn neu-btn w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight glow-text">Analytics</h1>
            <p className="text-emerald-100 text-xs">Spending insights</p>
          </div>
          <Sparkles className="ml-auto w-5 h-5 text-white/60 animate-pulse" />
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-3">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-2 animate-slide-in stagger-1">
          <StatCard icon={TrendingUp}   label="Income" value={`₹${totalInc.toLocaleString('en-IN')}`}          grad="from-emerald-400 to-teal-500"  glow="glow-emerald-pulse" delay={0.04} />
          <StatCard icon={TrendingDown} label="Spent"  value={`₹${totalExp.toLocaleString('en-IN')}`}          grad="from-rose-400 to-pink-500"      glow="glow-rose-pulse"    delay={0.08} />
          <StatCard icon={Wallet}       label="Saved"  value={`₹${Math.abs(savings).toLocaleString('en-IN')}`} grad={savings>=0?'from-sky-400 to-blue-500':'from-orange-400 to-red-500'} glow={savings>=0?'glow-sky-pulse':'glow-rose-pulse'} delay={0.12} />
        </div>

        {/* ── Monthly breakdown ── */}
        <div className="neu glow-border rounded-2xl overflow-hidden animate-card-in stagger-2 glow-emerald-pulse">
          <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <div className="p-4 bg-[#e8f4fd] dark:bg-[#0f2236]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Monthly Breakdown</p>
              </div>
              <div className="flex items-center gap-1 neu-inset rounded-xl px-2 py-1">
                <button onClick={prevMonth} className="touch-btn p-0.5 rounded-lg">
                  <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 min-w-[72px] text-center">{MONTHS[month]} {year}</span>
                <button onClick={nextMonth} className="touch-btn p-0.5 rounded-lg">
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="neu-inset rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-400 font-medium">Income</p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{mTotalInc.toLocaleString('en-IN')}</p>
              </div>
              <div className="neu-inset rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-400 font-medium">Spent</p>
                <p className="text-sm font-black text-rose-500">₹{mTotalExp.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {mCatData.length > 0 ? (
              <div className="space-y-2">
                {mCatData.map((item, i) => {
                  const pct = mTotalExp > 0 ? (item.value/mTotalExp)*100 : 0;
                  const color = CAT_COLORS[item.name] || COLORS[i%COLORS.length];
                  return (
                    <div key={item.name} className="animate-card-in" style={{animationDelay:`${i*0.05}s`}}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor:color}} />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{pct.toFixed(0)}%</span>
                          <span className="text-xs font-bold text-gray-800 dark:text-white">₹{item.value.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="neu-inset rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full progress-animated" style={{width:`${pct}%`,backgroundColor:color}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400">No expenses for {MONTHS[month]} {year}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pie chart ── */}
        <div className="neu glow-border rounded-2xl overflow-hidden animate-card-in stagger-3 glow-violet-pulse">
          <div className="h-0.5 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400" />
          <div className="p-4 bg-[#e8f4fd] dark:bg-[#0f2236]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm">
                <PieIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Category Split</p>
                <p className="text-[10px] text-gray-400">All-time distribution</p>
              </div>
            </div>
            {catData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                      label={({name,percent}) => percent>0.08 ? `${(percent*100).toFixed(0)}%` : ''}
                      labelLine={false}>
                      {catData.map((e,i) => <Cell key={i} fill={CAT_COLORS[e.name]||COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v=>`₹${parseFloat(v).toLocaleString('en-IN')}`}
                      contentStyle={{fontSize:11,borderRadius:10,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {catData.map((item,i) => (
                    <div key={i} className="flex items-center gap-1.5 animate-tag-pop" style={{animationDelay:`${i*0.04}s`}}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:CAT_COLORS[item.name]||COLORS[i%COLORS.length]}} />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                      <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 ml-auto">₹{item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-gray-400">No expense data</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Bar chart ── */}
        <div className="neu glow-border rounded-2xl overflow-hidden animate-card-in stagger-4 glow-sky-pulse">
          <div className="h-0.5 bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400" />
          <div className="p-4 bg-[#e8f4fd] dark:bg-[#0f2236]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-sm">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Monthly Trend</p>
                <p className="text-[10px] text-gray-400">Income vs Expenses</p>
              </div>
              <div className="ml-auto flex gap-1.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">Income</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500">Spent</span>
              </div>
            </div>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} barSize={10} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="m" tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                    tickFormatter={v=>`₹${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} />
                  <Tooltip formatter={v=>`₹${parseFloat(v).toLocaleString('en-IN')}`}
                    contentStyle={{fontSize:11,borderRadius:10,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="income"   fill="#10b981" name="Income"   radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-gray-400">No monthly data</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Insights ── */}
        <div className="neu glow-border rounded-2xl overflow-hidden animate-card-in stagger-5 glow-amber">
          <div className="h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
          <div className="p-4 bg-[#e8f4fd] dark:bg-[#0f2236]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Insights</p>
            </div>
            <div className="space-y-2">
              {catData.length > 0 && (
                <div className="neu-inset rounded-xl p-2.5 flex items-start gap-2 animate-tag-pop">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Top spend: <span className="font-bold text-amber-600 dark:text-amber-400">{catData[0]?.name}</span> — ₹{catData[0]?.value.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              {savings > 0 && (
                <div className="neu-inset rounded-xl p-2.5 flex items-start gap-2 animate-tag-pop" style={{animationDelay:'0.05s'}}>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Saving <span className="font-bold text-emerald-600 dark:text-emerald-400">{((savings/totalInc)*100).toFixed(1)}%</span> of income
                  </p>
                </div>
              )}
              {savings < 0 && (
                <div className="neu-inset rounded-xl p-2.5 flex items-start gap-2 animate-tag-pop" style={{animationDelay:'0.05s'}}>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Expenses exceed income by <span className="font-bold text-red-500">₹{Math.abs(savings).toLocaleString('en-IN')}</span>
                  </p>
                </div>
              )}
              <div className="neu-inset rounded-xl p-2.5 flex items-start gap-2 animate-tag-pop" style={{animationDelay:'0.1s'}}>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-sky-600 dark:text-sky-400">{expenses.length}</span> transactions across <span className="font-bold text-sky-600 dark:text-sky-400">{catData.length}</span> categories
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
