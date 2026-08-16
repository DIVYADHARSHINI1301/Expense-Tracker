import { useState, useEffect } from 'react';
import { Plus, Calendar, Edit2, Trash2, Check, X, ArrowLeft, FileText, Briefcase, Monitor, Building2, TrendingUp, Gift, MoreHorizontal, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addIncome, getIncome, updateIncome, deleteIncome } from '../firebase/firestore';
import GlowLoader from './GlowLoader';
import toast from 'react-hot-toast';

const SOURCES = [
  { key: 'Salary',      icon: Briefcase   },
  { key: 'Freelancing', icon: Monitor     },
  { key: 'Business',    icon: Building2   },
  { key: 'Investment',  icon: TrendingUp  },
  { key: 'Gift',        icon: Gift        },
  { key: 'Other',       icon: MoreHorizontal },
];

export default function AddIncome({ onUpdate }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]         = useState({ source: 'Salary', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [list, setList]         = useState([]);
  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchIncome(); }, [currentUser]);
  useEffect(() => {
    if (form.source !== 'Other') setForm(f => ({ ...f, description: '' }));
  }, [form.source]);

  const fetchIncome = async () => {
    setFetching(true);
    if (currentUser) {
      try { setList(await getIncome(currentUser.uid)); }
      catch (e) { console.error(e); }
    }
    setFetching(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount) { toast.error('Enter an amount'); return; }
    if (form.source === 'Other' && !form.description.trim()) { toast.error('Describe the source'); return; }
    setLoading(true);
    try {
      const d = new Date(form.date), now = new Date();
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      await addIncome(currentUser.uid, {
        source: form.source === 'Other' ? form.description.trim() : form.source,
        amount: parseFloat(form.amount),
        date: d.toISOString(),
      });
      toast.success('Income added');
      setForm({ source: 'Salary', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchIncome(); onUpdate();
    } catch { toast.error('Failed to add'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    try {
      await updateIncome(currentUser.uid, editId, { source: editForm.source, amount: parseFloat(editForm.amount), date: editForm.date });
      setList(list.map(i => i.id === editId ? { ...editForm, amount: parseFloat(editForm.amount) } : i));
      setEditId(null); toast.success('Updated'); onUpdate();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this income?')) return;
    try {
      await deleteIncome(currentUser.uid, id);
      setList(list.filter(i => i.id !== id)); toast.success('Deleted'); onUpdate();
    } catch { toast.error('Failed'); }
  };

  if (fetching) return <GlowLoader label="Loading income..." />;

  const showDesc = form.source === 'Other';

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
            <h1 className="text-white text-base font-bold">Add Income</h1>
            <p className="text-[#8a9bb0] text-xs">Record your earnings</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-6">

        {/* Form card */}
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in">
          <div className="h-0.5 bg-[#4a9eff]" />
          <div className="p-4 space-y-4">

            {/* Source chips */}
            <div>
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest mb-2.5">Income Source</p>
              <div className="grid grid-cols-3 gap-1.5">
                {SOURCES.map(({ key, icon: Icon }) => {
                  const active = form.source === key;
                  return (
                    <button key={key} type="button"
                      onClick={() => setForm({ ...form, source: key })}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-150 active:scale-95
                        ${active
                          ? 'border-[#4a9eff] bg-[#eef6ff] dark:bg-[#1a2a3e]'
                          : 'border-[#e8ecf0] dark:border-[#1e2a38] bg-[#f8fafc] dark:bg-[#1a2332]'
                        }`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-[#4a9eff]' : 'text-[#8a9bb0]'}`} strokeWidth={1.8} />
                      <span className={`text-[10px] font-semibold ${active ? 'text-[#4a9eff]' : 'text-[#8a9bb0]'}`}>{key}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: showDesc ? '72px' : '0', opacity: showDesc ? 1 : 0 }}>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
                <input type="text" placeholder="Describe the source"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff] transition-colors" />
              </div>
            </div>

            {/* Amount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a9eff] font-bold text-sm">₹</span>
              <input type="number" placeholder="0.00"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] text-base font-bold focus:outline-none focus:border-[#4a9eff] transition-colors" />
            </div>

            {/* Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff] transition-colors" />
            </div>

            {/* Submit */}
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full bg-[#4a9eff] hover:bg-[#3a8eef] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
              <Plus className="w-4 h-4" />
              {loading ? 'Adding...' : 'Add Income'}
            </button>
          </div>
        </div>

        {/* Income list */}
        {list.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest">Recent Income</p>
              <div className="flex-1 h-px bg-[#e8ecf0] dark:bg-[#1e2a38]" />
              <span className="text-[10px] font-bold text-[#4a9eff] bg-[#eef6ff] dark:bg-[#1a2a3e] px-2 py-0.5 rounded-full">{list.length}</span>
            </div>

            {list.map((inc, idx) => {
              const Src = SOURCES.find(s => s.key === inc.source);
              const Icon = Src ? Src.icon : DollarSign;
              return (
                <div key={inc.id}
                  className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}>
                  {editId === inc.id ? (
                    <div className="p-3 space-y-2">
                      <input type="text" value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]" placeholder="Source" />
                      <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]" placeholder="Amount" />
                      <input type="date" value={editForm.date?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]" />
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
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] dark:bg-[#1a3a2a] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#4ade80]" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8] truncate">{inc.source}</p>
                        <p className="text-[10px] text-[#8a9bb0]">{new Date(inc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <p className="text-sm font-black text-[#4ade80] flex-shrink-0">₹{parseFloat(inc.amount).toLocaleString('en-IN')}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditId(inc.id); setEditForm(inc); }}
                          className="w-7 h-7 rounded-lg bg-[#f4f6f8] dark:bg-[#1a2332] flex items-center justify-center text-[#6b7a8d] active:scale-90 transition-transform">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(inc.id)}
                          className="w-7 h-7 rounded-lg bg-[#fff5f5] dark:bg-[#3a1a1a] flex items-center justify-center text-[#f87171] active:scale-90 transition-transform">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
