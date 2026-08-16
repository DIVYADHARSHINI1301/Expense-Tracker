import { useState, useEffect } from 'react';
import { Search, Trash2, Edit2, Filter, X, Check, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getWalletExpenses, updateWalletExpense, deleteWalletExpense,
  getWalletIncome,
} from '../firebase/firestore';
import CategoryDropdown from './CategoryDropdown';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Others'];

const CATEGORY_COLORS = {
  Food: 'bg-orange-100 text-orange-600 border-orange-200',
  Travel: 'bg-blue-100 text-blue-600 border-blue-200',
  Shopping: 'bg-pink-100 text-pink-600 border-pink-200',
  Bills: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  Entertainment: 'bg-purple-100 text-purple-600 border-purple-200',
  Education: 'bg-green-100 text-green-600 border-green-200',
  Health: 'bg-red-100 text-red-600 border-red-200',
  Others: 'bg-gray-100 text-gray-600 border-gray-200',
};

const WalletHistory = ({ refreshTrigger, onUpdate }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [incomeList, setIncomeList] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [exp, inc] = await Promise.all([
          getWalletExpenses(currentUser.uid),
          getWalletIncome(currentUser.uid),
        ]);
        setExpenses(exp);
        setIncomeList(inc);
      } catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [currentUser, refreshTrigger]);

  const handleDelete = async (id) => {
    try {
      await deleteWalletExpense(currentUser.uid, id);
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Expense deleted!');
      onUpdate?.();
    } catch { toast.error('Failed to delete'); }
  };

  const handleUpdate = async () => {
    try {
      const updated = { title: editForm.title, amount: parseFloat(editForm.amount), category: editForm.category, date: editForm.date, notes: editForm.notes };
      await updateWalletExpense(currentUser.uid, editingId, updated);
      setExpenses(expenses.map(e => e.id === editingId ? { ...editForm, ...updated } : e));
      setEditingId(null);
      toast.success('Expense updated!');
      onUpdate?.();
    } catch { toast.error('Failed to update'); }
  };

  // Build transactions with running balance
  const allTx = [
    ...expenses.map(e => ({ ...e, type: 'expense' })),
    ...incomeList.map(i => ({ ...i, type: 'income', title: i.source })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let running = 0;
  const withBalance = allTx.map(t => {
    running += t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount);
    return { ...t, balance: running };
  }).reverse();

  const filtered = withBalance.filter(t => {
    if (t.type !== 'expense') return false;
    if (filterCat !== 'All' && t.category !== filterCat) return false;
    if (!t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFilter && !t.date.startsWith(dateFilter)) return false;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a1929]">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929] pb-6 animate-fade-in">
      <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-800 dark:to-purple-900 px-5 pt-8 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/wallet')} className="touch-btn w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Wallet History</h1>
            <p className="text-violet-100 text-xs">All wallet transactions</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 5C120 10 240 20 360 23.3C480 27 600 23 720 21.7C840 20 960 20 1080 23.3C1200 27 1320 33 1380 36.7L1440 40V60H0V0Z" fill="currentColor" className="text-white dark:text-[#0a1929]" />
          </svg>
        </div>
      </div>

      <div className="px-5 -mt-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 mb-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-in">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search wallet expenses..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 appearance-none bg-white dark:bg-gray-800 dark:text-gray-100 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm" />
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{filtered.length} expense{filtered.length !== 1 ? 's' : ''} found</span>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No wallet expenses found</h3>
              <p className="text-gray-500 dark:text-gray-400">Add wallet expenses to see them here</p>
            </div>
          ) : (
            filtered.map((expense, idx) => (
              <div key={expense.id} className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                {editingId === expense.id ? (
                  <div className="p-5 space-y-3">
                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Title" />
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Amount" />
                    <CategoryDropdown value={editForm.category} onChange={cat => setEditForm({ ...editForm, category: cat })} />
                    <input type="date" value={editForm.date?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" />
                    <div className="flex gap-3">
                      <button onClick={handleUpdate} className="touch-btn flex-1 px-4 py-3 bg-violet-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="touch-btn flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2">
                        <X className="w-5 h-5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 dark:from-purple-700 dark:to-violet-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg font-bold">{expense.title?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-800 dark:text-white text-base truncate">{expense.title}</h3>
                          <span className="text-lg font-bold text-violet-500 flex-shrink-0">₹{parseFloat(expense.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[expense.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{expense.category}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-800">
                            {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expense.notes && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">{expense.notes}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Balance after</p>
                        <p className={`text-sm font-bold ${expense.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>₹{parseFloat(expense.balance).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(expense.id); setEditForm(expense); }} className="touch-btn p-2.5 bg-violet-50 dark:bg-violet-900/30 text-violet-500 rounded-xl">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="touch-btn p-2.5 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletHistory;
