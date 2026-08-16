import { useState, useEffect } from 'react';
import { Plus, Calendar, ArrowLeft, Edit2, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addGoldPurchase, getGoldPurchases, updateGoldPurchase, deleteGoldPurchase } from '../firebase/firestore';
import toast from 'react-hot-toast';

const GoldAddPurchase = ({ onUpdate }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    grams: '', amount: '', rate: '',
    date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchList(); }, [currentUser]);

  const fetchList = async () => {
    if (!currentUser) return;
    try { setList(await getGoldPurchases(currentUser.uid)); } catch (e) { console.error(e); }
  };

  // Auto-calculate rate when grams and amount are filled
  const handleGramsOrAmount = (field, value) => {
    const updated = { ...form, [field]: value };
    if (updated.grams && updated.amount) {
      updated.rate = (parseFloat(updated.amount) / parseFloat(updated.grams)).toFixed(2);
    }
    setForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.grams || !form.amount) { toast.error('Please fill required fields'); return; }
    setLoading(true);
    try {
      const d = new Date(form.date);
      const now = new Date();
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      await addGoldPurchase(currentUser.uid, {
        grams: parseFloat(form.grams),
        amount: parseFloat(form.amount),
        rate: parseFloat(form.rate) || 0,
        date: d.toISOString(),
        notes: form.notes,
      });
      toast.success('Gold purchase recorded!');
      setForm({ grams: '', amount: '', rate: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchList();
      onUpdate?.();
    } catch { toast.error('Failed to add purchase'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    try {
      await updateGoldPurchase(currentUser.uid, editingId, {
        grams: parseFloat(editForm.grams), amount: parseFloat(editForm.amount),
        rate: parseFloat(editForm.rate) || 0, date: editForm.date, notes: editForm.notes,
      });
      setList(list.map(i => i.id === editingId ? { ...editForm, grams: parseFloat(editForm.grams), amount: parseFloat(editForm.amount) } : i));
      setEditingId(null);
      toast.success('Purchase updated!');
      onUpdate?.();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase?')) return;
    try {
      await deleteGoldPurchase(currentUser.uid, id);
      setList(list.filter(i => i.id !== id));
      toast.success('Purchase deleted!');
      onUpdate?.();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929]">
      <div className="bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-700 dark:to-yellow-800 px-5 pt-6 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/gold')} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Buy Gold</h1>
            <p className="text-amber-100 text-sm">Record gold purchase</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Gold (grams) *</label>
              <input type="number" step="0.001" placeholder="e.g. 2.500" value={form.grams}
                onChange={e => handleGramsOrAmount('grams', e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Amount Paid (₹) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                <input type="number" placeholder="0.00" value={form.amount}
                  onChange={e => handleGramsOrAmount('amount', e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-lg font-semibold bg-white dark:bg-gray-800 dark:text-gray-100" />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Rate per gram (₹) — auto-calculated</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                <input type="number" placeholder="Auto" value={form.rate}
                  onChange={e => setForm({ ...form, rate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100" />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100" />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Notes (Optional)</label>
              <textarea placeholder="e.g. Jewellery shop, online purchase..." value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none bg-white dark:bg-gray-800 dark:text-gray-100"
                rows="2" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
              <Plus className="w-5 h-5" />
              {loading ? 'Recording...' : 'Record Purchase'}
            </button>
          </form>
        </div>

        {list.length > 0 && (
          <div className="mt-6 space-y-3 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Purchase History</h3>
            {list.map(item => (
              <div key={item.id} className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <input type="number" step="0.001" value={editForm.grams} onChange={e => setEditForm({ ...editForm, grams: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Grams" />
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Amount (₹)" />
                    <input type="number" value={editForm.rate} onChange={e => setEditForm({ ...editForm, rate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Rate/gram" />
                    <input type="date" value={editForm.date?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800 dark:text-gray-100" />
                    <div className="flex gap-3">
                      <button onClick={handleUpdate} className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                          {parseFloat(item.grams).toFixed(3)}g
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-amber-500">₹{parseFloat(item.amount).toFixed(2)}</p>
                      {item.rate > 0 && <p className="text-xs text-gray-500 dark:text-gray-400">₹{parseFloat(item.rate).toFixed(2)}/g</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(item.id); setEditForm(item); }} className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-lg hover:bg-amber-100 transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors">
                        <Trash2 className="w-5 h-5" />
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

export default GoldAddPurchase;
