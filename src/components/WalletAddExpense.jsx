import { useState, useEffect } from 'react';
import { Plus, Calendar, ArrowLeft, Edit2, Trash2, Check, X, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  addWalletExpense, getWalletExpenses, updateWalletExpense, deleteWalletExpense,
} from '../firebase/firestore';
import CategoryDropdown from './CategoryDropdown';
import toast from 'react-hot-toast';

const WalletAddExpense = ({ onUpdate }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Food',
    date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchList(); }, [currentUser]);

  const fetchList = async () => {
    if (!currentUser) return;
    try { setList((await getWalletExpenses(currentUser.uid)).slice(0, 5)); } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) { toast.error('Please fill required fields'); return; }
    setLoading(true);
    try {
      const d = new Date(form.date);
      const now = new Date();
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      await addWalletExpense(currentUser.uid, {
        title: form.title, amount: parseFloat(form.amount),
        category: form.category, date: d.toISOString(), notes: form.notes
      });
      toast.success('Wallet expense added!');
      setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchList();
      onUpdate?.();
    } catch { toast.error('Failed to add expense'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    try {
      await updateWalletExpense(currentUser.uid, editingId, {
        title: editForm.title, amount: parseFloat(editForm.amount),
        category: editForm.category, date: editForm.date, notes: editForm.notes
      });
      setList(list.map(e => e.id === editingId ? { ...editForm, amount: parseFloat(editForm.amount) } : e));
      setEditingId(null);
      toast.success('Expense updated!');
      onUpdate?.();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteWalletExpense(currentUser.uid, id);
      setList(list.filter(e => e.id !== id));
      toast.success('Expense deleted!');
      onUpdate?.();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929]">
      <div className="bg-gradient-to-br from-purple-400 to-violet-500 dark:from-purple-700 dark:to-violet-800 px-5 pt-6 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/wallet')} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Wallet Expense</h1>
            <p className="text-purple-100 text-sm">Track cash spending</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <TrendingDown className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add Cash Expense</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Record money spent from wallet</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Title *</label>
              <input type="text" placeholder="e.g., Lunch, Auto, Groceries" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                <input type="number" placeholder="0.00" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent text-lg font-semibold bg-white dark:bg-gray-800 dark:text-gray-100" />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Category *</label>
              <CategoryDropdown value={form.category} onChange={cat => setForm({ ...form, category: cat })} />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100" />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Notes (Optional)</label>
              <textarea placeholder="Additional notes..." value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none bg-white dark:bg-gray-800 dark:text-gray-100"
                rows="3" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-400 to-violet-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
              <Plus className="w-5 h-5" />
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        </div>

        {list.length > 0 && (
          <div className="mt-6 space-y-3 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Wallet Expenses</h3>
            {list.map(item => (
              <div key={item.id} className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Title" />
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Amount" />
                    <CategoryDropdown value={editForm.category} onChange={cat => setEditForm({ ...editForm, category: cat })} />
                    <input type="date" value={editForm.date?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" />
                    <div className="flex gap-3">
                      <button onClick={handleUpdate} className="flex-1 px-4 py-3 bg-violet-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2">
                        <X className="w-5 h-5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">{item.title}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300">{item.category}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-violet-500">₹{parseFloat(item.amount).toFixed(2)}</p>
                      <button onClick={() => { setEditingId(item.id); setEditForm(item); }} className="p-2 bg-violet-50 dark:bg-violet-900/30 text-violet-500 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletAddExpense;
