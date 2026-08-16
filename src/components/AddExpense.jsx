import { useState, useEffect } from 'react';
import { Plus, Calendar, Tag, CreditCard, FileText, Edit2, Trash2, Check, X, ArrowLeft,
  Utensils, Plane, ShoppingBag, Receipt, Film, BookOpen, Heart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addExpense, getExpenses, updateExpense, deleteExpense } from '../firebase/firestore';
import CategoryDropdown from './CategoryDropdown';
import PaymentDropdown from './PaymentDropdown';
import GlowLoader from './GlowLoader';
import toast from 'react-hot-toast';

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

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque'];

export default function AddExpense({ onUpdate }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Food',
    date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: ''
  });
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [list, setList]         = useState([]);
  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchExpenses(); }, [currentUser]);

  const fetchExpenses = async () => {
    setFetching(true);
    if (currentUser) {
      try { setList((await getExpenses(currentUser.uid)).slice(0, 5)); }
      catch (e) { console.error(e); }
    }
    setFetching(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.amount) { toast.error('Fill required fields'); return; }
    setLoading(true);
    try {
      const d = new Date(form.date), now = new Date();
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      await addExpense(currentUser.uid, { ...form, amount: parseFloat(form.amount), date: d.toISOString() });
      toast.success('Expense added');
      setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' });
      fetchExpenses(); onUpdate();
    } catch { toast.error('Failed to add'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    try {
      await updateExpense(currentUser.uid, editId, { ...editForm, amount: parseFloat(editForm.amount) });
      setList(list.map(e => e.id === editId ? { ...editForm, amount: parseFloat(editForm.amount) } : e));
      setEditId(null); toast.success('Updated'); onUpdate();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(currentUser.uid, id);
      setList(list.filter(e => e.id !== id)); toast.success('Deleted'); onUpdate();
    } catch { toast.error('Failed'); }
  };

  if (fetching) return <GlowLoader label="Loading expenses..." />;

  const meta = CAT_META[form.category] || CAT_META.Others;
  const CatIcon = meta.icon;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117]">

      {/* Header */}
      <div className="bg-[#1a2332] dark:bg-[#0d1117] px-4 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="w-8 h-8 rounded-xl bg-[#2a3a4e] flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-[#8a9bb0]" />
          </button>
          <div>
            <h1 className="text-white text-base font-bold">Add Expense</h1>
            <p className="text-[#8a9bb0] text-xs">Record your spending</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-6">

        {/* Form card */}
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in">
          {/* Dynamic accent line */}
          <div className="h-0.5 transition-all duration-500" style={{ backgroundColor: meta.accent }} />
          <div className="p-4 space-y-3">

            {/* Title */}
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
              <input type="text" placeholder="Expense title"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] font-medium focus:outline-none focus:border-[#4a9eff] transition-colors" />
            </div>

            {/* Amount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm z-10" style={{ color: meta.accent }}>₹</span>
              <input type="number" placeholder="0.00"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] text-base font-bold focus:outline-none focus:border-[#4a9eff] transition-colors" />
            </div>

            {/* Category */}
            <div>
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest mb-1.5">Category</p>
              <CategoryDropdown value={form.category} onChange={cat => setForm({ ...form, category: cat })} />
            </div>

            {/* Date + Payment */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3 h-3" />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full pl-7 pr-2 py-2.5 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff] transition-colors" />
              </div>
              <PaymentDropdown value={form.paymentMethod} onChange={m => setForm({ ...form, paymentMethod: m })} />
            </div>

            {/* Notes */}
            <textarea placeholder="Notes (optional)"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] resize-none focus:outline-none focus:border-[#4a9eff] transition-colors"
              rows="2" />

            {/* Submit */}
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ backgroundColor: meta.accent }}>
              <Plus className="w-4 h-4" />
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </div>

        {/* Recent list */}
        {list.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest">Recent</p>
              <div className="flex-1 h-px bg-[#e8ecf0] dark:bg-[#1e2a38]" />
              <span className="text-[10px] font-bold text-[#f87171] bg-[#fff5f5] dark:bg-[#3a1a1a] px-2 py-0.5 rounded-full">{list.length}</span>
            </div>

            {list.map((exp, idx) => {
              const m = CAT_META[exp.category] || CAT_META.Others;
              const EIcon = m.icon;
              return (
                <div key={exp.id}
                  className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center gap-3 p-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${m.bg}`}>
                      <EIcon className={`w-4 h-4 ${m.text}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8] truncate">{exp.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${m.bg} ${m.text}`}>{exp.category}</span>
                        <span className="text-[9px] text-[#8a9bb0]">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                    <p className="text-sm font-black text-[#f87171] flex-shrink-0">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
