// AccountAddExpense.jsx
import { useState, useEffect } from 'react';
import { Plus, Calendar, ArrowLeft, FileText, Utensils, Plane, ShoppingBag, Receipt, Film, BookOpen, Heart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounts } from '../context/AccountsContext';
import { acctAddExpense, acctGetExpenses } from '../firebase/accountFirestore';
import CategoryDropdown from './CategoryDropdown';
import PaymentDropdown from './PaymentDropdown';
import GlowLoader from './GlowLoader';
import toast from 'react-hot-toast';

const CAT_META = {
  Food:          { icon: Utensils,    accent: '#f97316' },
  Travel:        { icon: Plane,       accent: '#3b82f6' },
  Shopping:      { icon: ShoppingBag, accent: '#8b5cf6' },
  Bills:         { icon: Receipt,     accent: '#eab308' },
  Entertainment: { icon: Film,        accent: '#ec4899' },
  Education:     { icon: BookOpen,    accent: '#10b981' },
  Health:        { icon: Heart,       accent: '#ef4444' },
  Others:        { icon: Package,     accent: '#6b7a8d' },
};

export function AccountAddExpense({ onUpdate }) {
  const { accountId } = useParams();
  const { currentUser } = useAuth();
  const { accounts } = useAccounts();
  const navigate = useNavigate();

  const account = accounts.find(a => a.id === accountId);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' });
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [list, setList]         = useState([]);

  const fetchList = async () => {
    if (!currentUser || !accountId) return;
    setFetching(true);
    try { setList((await acctGetExpenses(currentUser.uid, accountId)).slice(0, 5)); }
    catch (e) { console.error(e); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchList(); }, [currentUser, accountId]);

  const handleSubmit = async () => {
    if (!form.title || !form.amount) { toast.error('Fill required fields'); return; }
    setLoading(true);
    try {
      const d = new Date(form.date), now = new Date();
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      await acctAddExpense(currentUser.uid, accountId, { ...form, amount: parseFloat(form.amount), date: d.toISOString() });
      toast.success('Expense added');
      setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' });
      fetchList(); onUpdate?.();
    } catch { toast.error('Failed to add'); }
    finally { setLoading(false); }
  };

  if (fetching) return <GlowLoader label="Loading expenses..." />;

  const meta = CAT_META[form.category] || CAT_META.Others;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117]">
      <div className="bg-[#1a2332] dark:bg-[#0d1117] px-4 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/account/${accountId}`)}
            className="w-8 h-8 rounded-xl bg-[#2a3a4e] flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-[#8a9bb0]" />
          </button>
          <div>
            <h1 className="text-white text-base font-bold">Add Expense</h1>
            <p className="text-[#8a9bb0] text-xs">{account?.name || 'Account'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-6">
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in">
          <div className="h-0.5 transition-all duration-500" style={{ backgroundColor: meta.accent }} />
          <div className="p-4 space-y-3">
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
              <input type="text" placeholder="Expense title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none transition-colors" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm z-10" style={{ color: meta.accent }}>₹</span>
              <input type="number" placeholder="0.00" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] text-base font-bold focus:outline-none transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest mb-1.5">Category</p>
              <CategoryDropdown value={form.category} onChange={cat => setForm({ ...form, category: cat })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3 h-3" />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full pl-7 pr-2 py-2.5 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none transition-colors" />
              </div>
              <PaymentDropdown value={form.paymentMethod} onChange={m => setForm({ ...form, paymentMethod: m })} />
            </div>
            <textarea placeholder="Notes (optional)" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] resize-none focus:outline-none transition-colors"
              rows="2" />
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ backgroundColor: meta.accent }}>
              <Plus className="w-4 h-4" />
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </div>

        {list.length > 0 && (
          <div className="space-y-2">
            {list.map((exp, idx) => {
              const m = CAT_META[exp.category] || CAT_META.Others;
              const EIcon = m.icon;
              return (
                <div key={exp.id} className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${m.accent}22` }}>
                      <EIcon className="w-4 h-4" style={{ color: m.accent }} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8] truncate">{exp.title}</p>
                      <p className="text-[9px] text-[#8a9bb0]">{exp.category} · {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
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
