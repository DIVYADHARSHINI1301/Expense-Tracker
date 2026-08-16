import { useState, useEffect } from 'react';
import { Plus, Calendar, ArrowLeft, Edit2, Trash2, Check, X, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addWalletIncome, getWalletIncome, updateWalletIncome, deleteWalletIncome } from '../firebase/firestore';
import toast from 'react-hot-toast';

const WALLET_INCOME_SOURCES = ['Cash Received', 'Transfer In', 'Salary Cash', 'Gift', 'Refund', 'Other'];

const SOURCE_ICONS = {
  'Cash Received': '💵', 'Transfer In': '🔄', 'Salary Cash': '💼', 'Gift': '🎁', 'Refund': '↩️', 'Other': '✏️',
};

const WalletAddIncome = ({ onUpdate }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ source: 'Cash Received', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => { fetchList(); }, [currentUser]);

  useEffect(() => {
    setShowDesc(form.source === 'Other');
    if (form.source !== 'Other') setForm(f => ({ ...f, description: '' }));
  }, [form.source]);

  const fetchList = async () => {
    if (!currentUser) return;
    try { setList(await getWalletIncome(currentUser.uid)); } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.source || !form.amount) { toast.error('Please fill all fields'); return; }
    if (form.source === 'Other' && !form.description.trim()) { toast.error('Please describe the source'); return; }
    setLoading(true);
    try {
      const d = new Date(form.date);
      const now = new Date();
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      await addWalletIncome(currentUser.uid, {
        source: form.source === 'Other' ? form.description.trim() : form.source,
        amount: parseFloat(form.amount),
        date: d.toISOString(),
      });
      toast.success('Wallet income added!');
      setForm({ source: 'Cash Received', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchList();
      onUpdate?.();
    } catch { toast.error('Failed to add income'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    try {
      await updateWalletIncome(currentUser.uid, editingId, { source: editForm.source, amount: parseFloat(editForm.amount), date: editForm.date });
      setList(list.map(i => i.id === editingId ? { ...editForm, amount: parseFloat(editForm.amount) } : i));
      setEditingId(null);
      toast.success('Income updated!');
      onUpdate?.();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income?')) return;
    try {
      await deleteWalletIncome(currentUser.uid, id);
      setList(list.filter(i => i.id !== id));
      toast.success('Income deleted!');
      onUpdate?.();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929]">
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-800 dark:to-purple-900 px-5 pt-6 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/wallet')} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Wallet Income</h1>
            <p className="text-violet-100 text-sm">Track cash received</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 animate-slide-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl">
              <TrendingUp className="w-8 h-8 text-violet-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add Cash Income</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Record money added to wallet</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Source chip selector */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-3 text-sm">Source *</label>
              <div className="grid grid-cols-3 gap-2">
                {WALLET_INCOME_SOURCES.map(src => {
                  const active = form.source === src;
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setForm({ ...form, source: src })}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
                        active
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-violet-300'
                      }`}
                    >
                      <span className="text-xl leading-none">{SOURCE_ICONS[src]}</span>
                      <span className={`text-[10px] font-semibold text-center leading-tight ${active ? 'text-violet-600 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400'}`}>
                        {src}
                      </span>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description slide-in */}
            <div
              className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ maxHeight: showDesc ? '120px' : '0', opacity: showDesc ? 1 : 0 }}
            >
              <div className="pt-1">
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Describe the source *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sold item, borrowed money..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-violet-300 dark:border-violet-700 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-violet-50/50 dark:bg-gray-800 dark:text-gray-100 transition-all"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent text-lg font-semibold bg-white dark:bg-gray-800 dark:text-gray-100 transition-all" />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100 transition-all" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
              <Plus className="w-5 h-5" />
              {loading ? 'Adding...' : 'Add Income'}
            </button>
          </form>
        </div>

        {list.length > 0 && (
          <div className="mt-6 space-y-3 mb-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Recent Wallet Income</h3>
            {list.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <input type="text" value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Source" />
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" />
                    <input type="date" value={editForm.date?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-800 dark:text-gray-100" />
                    <div className="flex gap-3">
                      <button onClick={handleUpdate} className="flex-1 px-4 py-3 bg-violet-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <Check className="w-5 h-5" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <X className="w-5 h-5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                          {item.source}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-violet-500">₹{parseFloat(item.amount).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(item.id); setEditForm(item); }}
                        className="p-2.5 bg-violet-50 dark:bg-violet-900/30 text-violet-500 rounded-xl hover:bg-violet-100 active:scale-90 transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 active:scale-90 transition-all">
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

export default WalletAddIncome;
