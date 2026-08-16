import { useState, useEffect } from 'react';
import { Search, Trash2, Edit2, Filter, X, Check, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getGoldPurchases, updateGoldPurchase, deleteGoldPurchase,
  getGoldSales, updateGoldSale, deleteGoldSale,
} from '../firebase/firestore';
import toast from 'react-hot-toast';

const GoldHistory = ({ refreshTrigger, onUpdate }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [p, s] = await Promise.all([getGoldPurchases(currentUser.uid), getGoldSales(currentUser.uid)]);
        setPurchases(p);
        setSales(s);
      } catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [currentUser, refreshTrigger]);

  const handleDelete = async (id, type) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      if (type === 'purchase') {
        await deleteGoldPurchase(currentUser.uid, id);
        setPurchases(purchases.filter(p => p.id !== id));
      } else {
        await deleteGoldSale(currentUser.uid, id);
        setSales(sales.filter(s => s.id !== id));
      }
      toast.success('Deleted!');
      onUpdate?.();
    } catch { toast.error('Failed to delete'); }
  };

  const handleUpdate = async () => {
    try {
      const data = { grams: parseFloat(editForm.grams), amount: parseFloat(editForm.amount), rate: parseFloat(editForm.rate) || 0, date: editForm.date, notes: editForm.notes };
      if (editType === 'purchase') {
        await updateGoldPurchase(currentUser.uid, editingId, data);
        setPurchases(purchases.map(p => p.id === editingId ? { ...editForm, ...data } : p));
      } else {
        await updateGoldSale(currentUser.uid, editingId, data);
        setSales(sales.map(s => s.id === editingId ? { ...editForm, ...data } : s));
      }
      setEditingId(null);
      toast.success('Updated!');
      onUpdate?.();
    } catch { toast.error('Failed to update'); }
  };

  const allTx = [
    ...purchases.map(p => ({ ...p, type: 'purchase' })),
    ...sales.map(s => ({ ...s, type: 'sale' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = allTx.filter(t => {
    if (typeFilter !== 'All' && t.type !== typeFilter.toLowerCase()) return false;
    if (dateFilter && !t.date.startsWith(dateFilter)) return false;
    if (search && !`${t.notes || ''} ${t.type}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a1929]">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929] pb-6 animate-fade-in">
      <div className="relative bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-700 dark:to-yellow-800 px-5 pt-8 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/gold')} className="touch-btn w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Gold History</h1>
            <p className="text-amber-100 text-xs">All gold transactions</p>
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
              <input type="text" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 appearance-none bg-white dark:bg-gray-800 dark:text-gray-100 text-sm">
                  {['All', 'Purchase', 'Sale'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm" />
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</span>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No gold records found</h3>
              <p className="text-gray-500 dark:text-gray-400">Add gold purchases or sales to see them here</p>
            </div>
          ) : (
            filtered.map((tx, idx) => (
              <div key={tx.id} className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                {editingId === tx.id ? (
                  <div className="p-5 space-y-3">
                    <input type="number" step="0.001" value={editForm.grams} onChange={e => setEditForm({ ...editForm, grams: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Grams" />
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Amount (₹)" />
                    <input type="number" value={editForm.rate} onChange={e => setEditForm({ ...editForm, rate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Rate/gram" />
                    <input type="date" value={editForm.date?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100" />
                    <textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100 resize-none" placeholder="Notes" rows="2" />
                    <div className="flex gap-3">
                      <button onClick={handleUpdate} className="touch-btn flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
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
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'purchase'
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-700 dark:to-yellow-800'
                          : 'bg-gradient-to-br from-yellow-300 to-amber-400 dark:from-yellow-700 dark:to-amber-700'
                      }`}>
                        <span className="text-white text-sm font-bold">{tx.type === 'purchase' ? 'BUY' : 'SELL'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-800 dark:text-white text-base">
                            {tx.type === 'purchase' ? 'Gold Purchase' : 'Gold Sale'} — {parseFloat(tx.grams || 0).toFixed(3)}g
                          </h3>
                          <span className="text-lg font-bold text-amber-500 flex-shrink-0">₹{parseFloat(tx.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            tx.type === 'purchase'
                              ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                              : 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
                          }`}>
                            {tx.type === 'purchase' ? 'Purchase' : 'Sale'}
                          </span>
                          {tx.rate > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                              ₹{parseFloat(tx.rate).toFixed(0)}/g
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                            {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {tx.notes && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">{tx.notes}</p>
                    )}
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 gap-2">
                      <button onClick={() => { setEditingId(tx.id); setEditType(tx.type); setEditForm(tx); }} className="touch-btn p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(tx.id, tx.type)} className="touch-btn p-2.5 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
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

export default GoldHistory;
