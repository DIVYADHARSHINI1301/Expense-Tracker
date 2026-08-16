import { useState, useEffect } from 'react';
import { Search, Trash2, Edit2, Filter, X, Check, Calendar, ArrowLeft, TrendingDown,
  Utensils, Plane, ShoppingBag, Receipt, Film, BookOpen, Heart, Package, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getExpenses, updateExpense, deleteExpense, getIncome } from '../firebase/firestore';
import CategoryDropdown from './CategoryDropdown';
import PaymentDropdown from './PaymentDropdown';
import GlowLoader from './GlowLoader';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Others'];

const CAT_META = {
  Food:          { icon: Utensils,    accent: '#f97316', bg: 'bg-[#fff7ed] dark:bg-[#2a1a0a]', text: 'text-[#f97316]' },
  Travel:        { icon: Plane,       accent: '#3b82f6', bg: 'bg-[#eff6ff] dark:bg-[#0a1a2a]', text: 'text-[#3b82f6]' },
  Shopping:      { icon: ShoppingBag, accent: '#8b5cf6', bg: 'bg-[#f5f3ff] dark:bg-[#1a0a2a]', text: 'text-[#8b5cf6]' },
  Bills:         { icon: Receipt,     accent: '#eab308', bg: 'bg-[#fefce8] dark:bg-[#2a2a0a]', text: 'text-[#eab308]' },
  Entertainment: { icon: Film,        accent: '#ec4899', bg: 'bg-[#fdf2f8] dark:bg-[#2a0a1a]', text: 'text-[#ec4899]' },
  Education:     { icon: BookOpen,    accent: '#10b981', bg: 'bg-[#f0fdf4] dark:bg-[#0a2a1a]', text: 'text-[#10b981]' },
  Health:        { icon: Heart,       accent: '#ef4444', bg: 'bg-[#fff5f5] dark:bg-[#2a0a0a]', text: 'text-[#ef4444]' },
  Others:        { icon: Package,     accent: '#6b7a8d', bg: 'bg-[#f8fafc] dark:bg-[#1a2332]', text: 'text-[#6b7a8d]' },
};

export default function ExpenseHistory({ refreshTrigger, onUpdate }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses]     = useState([]);
  const [income, setIncome]         = useState([]);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [editId, setEditId]         = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    (async () => {
      if (!currentUser) { setLoading(false); return; }
      setLoading(true);
      try {
        const [e, i] = await Promise.all([getExpenses(currentUser.uid), getIncome(currentUser.uid)]);
        setExpenses(e); setIncome(i);
      } catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    })();
  }, [currentUser, refreshTrigger]);

  const handleDelete = async id => {
    try {
      await deleteExpense(currentUser.uid, id);
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Deleted'); onUpdate();
    } catch { toast.error('Failed'); }
  };

  const handleUpdate = async () => {
    try {
      const u = { ...editForm, amount: parseFloat(editForm.amount) };
      await updateExpense(currentUser.uid, editId, u);
      setExpenses(expenses.map(e => e.id === editId ? u : e));
      setEditId(null); toast.success('Updated'); onUpdate();
    } catch { toast.error('Failed'); }
  };

  // Running balance
  const all = [
    ...expenses.map(e => ({ ...e, type: 'expense' })),
    ...income.map(i => ({ ...i, type: 'income', title: i.source })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let bal = 0;
  const withBal = all.map(t => {
    bal += t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount);
    return { ...t, balance: bal };
  }).reverse();

  const filtered = withBal.filter(t => {
    if (t.type !== 'expense') return false;
    if (catFilter !== 'All' && t.category !== catFilter) return false;
    if (!t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFilter && !t.date.startsWith(dateFilter)) return false;
    return true;
  });

  const total = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);

  if (loading) return <GlowLoader label="Loading history..." />;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117] pb-6 animate-fade-in">

      {/* Header */}
      <div className="bg-[#1a2332] dark:bg-[#0d1117] px-4 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="w-8 h-8 rounded-xl bg-[#2a3a4e] flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-[#8a9bb0]" />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-base font-bold">Expense History</h1>
            <p className="text-[#8a9bb0] text-xs">All recorded expenses</p>
          </div>
          <div className="bg-[#2a3a4e] rounded-xl px-3 py-1.5 text-right">
            <p className="text-[9px] text-[#8a9bb0] font-medium">Total</p>
            <p className="text-white text-xs font-black">₹{total.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Search & Filter */}
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in">
          <div className="h-0.5 bg-[#4a9eff]" />
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
              <input type="text" placeholder="Search expenses" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff] transition-colors" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-[#8a9bb0]" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3 h-3" />
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] appearance-none focus:outline-none focus:border-[#4a9eff] font-medium transition-colors">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3 h-3" />
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff] transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#8a9bb0]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              {(search || catFilter !== 'All' || dateFilter) && (
                <button onClick={() => { setSearch(''); setCatFilter('All'); setDateFilter(''); }}
                  className="text-[10px] font-bold text-[#4a9eff] flex items-center gap-1 active:scale-95 transition-transform">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#161d27] rounded-2xl p-10 text-center border border-[#e8ecf0] dark:border-[#1e2a38] animate-scale-in">
              <TrendingDown className="w-8 h-8 mx-auto mb-2 text-[#c8d8e8] dark:text-[#2a3a4e]" />
              <p className="text-sm font-semibold text-[#8a9bb0]">No expenses found</p>
            </div>
          ) : filtered.map((exp, idx) => {
            const m = CAT_META[exp.category] || CAT_META.Others;
            const EIcon = m.icon;
            return (
              <div key={exp.id}
                className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in cursor-pointer active:scale-[0.99] transition-transform"
                style={{ animationDelay: `${idx * 0.04}s` }}>
                {editId === exp.id ? (
                  <div className="p-3 space-y-2 animate-fade-in">
                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]" placeholder="Title" />
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]" placeholder="Amount" />
                    <CategoryDropdown value={editForm.category} onChange={c => setEditForm({ ...editForm, category: c })} />
                    <input type="date" value={editForm.date?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]" />
                    <PaymentDropdown value={editForm.paymentMethod} onChange={m => setEditForm({ ...editForm, paymentMethod: m })} />
                    <div className="flex gap-2">
                      <button onClick={handleUpdate} className="flex-1 py-2 bg-[#4a9eff] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform">
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-2 bg-[#f4f6f8] dark:bg-[#1a2332] text-[#6b7a8d] rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3" onClick={() => setSelected(exp)}>
                    {/* Left accent bar */}
                    <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: m.accent }} />

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${m.bg}`}>
                      <EIcon className={`w-4 h-4 ${m.text}`} strokeWidth={1.8} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8] truncate">{exp.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${m.bg} ${m.text}`}>{exp.category}</span>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[#f4f6f8] dark:bg-[#1a2332] text-[#8a9bb0]">{exp.paymentMethod}</span>
                        <span className="text-[9px] text-[#8a9bb0]">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>

                    {/* Amount + balance */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-[#f87171]">-₹{parseFloat(exp.amount).toLocaleString('en-IN')}</p>
                      <p className={`text-[9px] font-semibold ${exp.balance >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                        ₹{parseFloat(exp.balance).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); setEditId(exp.id); setEditForm(exp); }}
                        className="w-6 h-6 rounded-lg bg-[#f4f6f8] dark:bg-[#1a2332] flex items-center justify-center text-[#6b7a8d] active:scale-90 transition-transform">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(exp.id); }}
                        className="w-6 h-6 rounded-lg bg-[#fff5f5] dark:bg-[#3a1a1a] flex items-center justify-center text-[#f87171] active:scale-90 transition-transform">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (() => {
        const m = CAT_META[selected.category] || CAT_META.Others;
        const MIcon = m.icon;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center modal-backdrop"
            onClick={() => setSelected(null)}>
            <div className="bg-white dark:bg-[#161d27] rounded-t-3xl w-full max-w-lg modal-sheet overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="h-1" style={{ backgroundColor: m.accent }} />
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8ecf0] dark:border-[#1e2a38]">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.bg}`}>
                    <MIcon className={`w-4 h-4 ${m.text}`} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2d3748] dark:text-white">{selected.title}</p>
                    <p className={`text-[10px] font-semibold ${m.text}`}>{selected.category}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-full bg-[#f4f6f8] dark:bg-[#1a2332] flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-[#6b7a8d]" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  ['Amount',       `₹${parseFloat(selected.amount).toLocaleString('en-IN')}`, 'text-[#f87171] font-black'],
                  ['Date',         new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), ''],
                  ['Payment',      selected.paymentMethod, ''],
                  ['Balance after',`₹${parseFloat(selected.balance).toLocaleString('en-IN')}`, selected.balance >= 0 ? 'text-[#4ade80] font-bold' : 'text-[#f87171] font-bold'],
                  ...(selected.notes ? [['Notes', selected.notes, 'text-[#8a9bb0] italic']] : []),
                ].map(([label, value, cls]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-[#f4f6f8] dark:border-[#1e2a38] last:border-0">
                    <span className="text-xs font-semibold text-[#8a9bb0]">{label}</span>
                    <span className={`text-xs text-[#2d3748] dark:text-[#c8d8e8] ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
