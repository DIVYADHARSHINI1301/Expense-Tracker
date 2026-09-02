import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounts } from '../context/AccountsContext';
import { acctAddPurchase, acctGetPurchases, acctAddSale, acctGetSales } from '../firebase/accountFirestore';
import { combineDateAndTime, formatDateTime, formatTime12Hour, getCurrentDateFormatted, getCurrentTimeFormatted } from '../utils/dateUtils';
import DatePickerInput from './DatePickerInput';
import GlowLoader from './GlowLoader';
import toast from 'react-hot-toast';

// ─── Buy Gold ─────────────────────────────────────────────────────────────────
export function AccountBuyGold({ onUpdate }) {
  const { accountId } = useParams();
  const { currentUser } = useAuth();
  const { accounts } = useAccounts();
  const navigate = useNavigate();

  const account = accounts.find(a => a.id === accountId);
  const accent  = account?.accent || '#f59e0b';

  const [form, setForm] = useState({
    grams: '',
    amount: '',
    rate: '',
    date: getCurrentDateFormatted(),
    time: getCurrentTimeFormatted(),
    notes: '',
  });
  const [loading, setLoading]   = useState(false);
  const [list, setList]         = useState([]);
  const [fetching, setFetching] = useState(true);

  const fetchList = async () => {
    if (!currentUser || !accountId) return;
    setFetching(true);
    try {
      setList((await acctGetPurchases(currentUser.uid, accountId)).slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchList(); }, [currentUser, accountId]);

  // Auto-calc amount from grams × rate
  const handleGramsOrRate = (field, value) => {
    const updated = { ...form, [field]: value };
    const g = parseFloat(updated.grams), r = parseFloat(updated.rate);
    if (!isNaN(g) && !isNaN(r)) updated.amount = (g * r).toFixed(2);
    setForm(updated);
  };

  const handleSubmit = async () => {
    if (!form.grams || !form.amount) { toast.error('Enter grams and amount'); return; }
    setLoading(true);
    try {
      const isoDate = combineDateAndTime(form.date, form.time);
      const timeFormatted = formatTime12Hour(form.time);

      await acctAddPurchase(currentUser.uid, accountId, {
        grams: parseFloat(form.grams),
        amount: parseFloat(form.amount),
        rate: form.rate ? parseFloat(form.rate) : null,
        date: isoDate,
        time: timeFormatted,
        notes: form.notes,
      });
      toast.success('Gold purchase recorded');
      setForm({
        grams: '',
        amount: '',
        rate: '',
        date: getCurrentDateFormatted(),
        time: getCurrentTimeFormatted(),
        notes: '',
      });
      fetchList();
      onUpdate?.();
    } catch {
      toast.error('Failed to add');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <GlowLoader label="Loading..." />;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117]">
      <div className="px-4 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${accent}ee, ${accent}99)` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/account/${accountId}`)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-white text-base font-bold">Buy Gold</h1>
            <p className="text-white/60 text-xs">{account?.name || 'Gold Account'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-6">
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in">
          <div className="h-0.5" style={{ backgroundColor: accent }} />
          <div className="p-4 space-y-3">
            {[
              { label: 'Grams',       field: 'grams',  placeholder: '0.000', type: 'number' },
              { label: 'Rate / gram', field: 'rate',   placeholder: '₹ per gram', type: 'number' },
              { label: 'Total Amount (₹)', field: 'amount', placeholder: '0.00', type: 'number' },
            ].map(({ label, field, placeholder, type }) => (
              <div key={field}>
                <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest mb-1">{label}</p>
                <input type={type} placeholder={placeholder} value={form[field]}
                  onChange={e => field === 'grams' || field === 'rate' ? handleGramsOrRate(field, e.target.value) : setForm({ ...form, [field]: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] font-bold focus:outline-none transition-colors" />
              </div>
            ))}

            {/* Date & Time Picker in DD/MM/YYYY */}
            <DatePickerInput
              date={form.date}
              time={form.time}
              onDateChange={d => setForm({ ...form, date: d })}
              onTimeChange={t => setForm({ ...form, time: t })}
              accent={accent}
            />

            <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] resize-none focus:outline-none transition-colors" rows="2" />
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
              style={{ backgroundColor: accent }}>
              <Plus className="w-4 h-4" />
              {loading ? 'Adding...' : 'Record Purchase'}
            </button>
          </div>
        </div>

        {list.length > 0 && (
          <div className="space-y-2">
            {list.map((p, i) => (
              <div key={p.id} className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] p-3 flex items-center gap-3 animate-card-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}22` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8]">{parseFloat(p.grams).toFixed(3)}g</p>
                  <p className="text-[10px] text-[#8a9bb0]">{formatDateTime(p.date, p.time)}{p.rate ? ` · ₹${parseFloat(p.rate).toFixed(0)}/g` : ''}</p>
                </div>
                <p className="text-sm font-black flex-shrink-0" style={{ color: accent }}>₹{parseFloat(p.amount).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sell Gold ────────────────────────────────────────────────────────────────
export function AccountSellGold({ onUpdate }) {
  const { accountId } = useParams();
  const { currentUser } = useAuth();
  const { accounts } = useAccounts();
  const navigate = useNavigate();

  const account = accounts.find(a => a.id === accountId);
  const accent  = account?.accent || '#f59e0b';

  const [form, setForm] = useState({
    grams: '',
    amount: '',
    rate: '',
    date: getCurrentDateFormatted(),
    time: getCurrentTimeFormatted(),
    notes: '',
  });
  const [loading, setLoading]   = useState(false);
  const [list, setList]         = useState([]);
  const [fetching, setFetching] = useState(true);

  const fetchList = async () => {
    if (!currentUser || !accountId) return;
    setFetching(true);
    try {
      setList((await acctGetSales(currentUser.uid, accountId)).slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchList(); }, [currentUser, accountId]);

  const handleGramsOrRate = (field, value) => {
    const updated = { ...form, [field]: value };
    const g = parseFloat(updated.grams), r = parseFloat(updated.rate);
    if (!isNaN(g) && !isNaN(r)) updated.amount = (g * r).toFixed(2);
    setForm(updated);
  };

  const handleSubmit = async () => {
    if (!form.grams || !form.amount) { toast.error('Enter grams and amount'); return; }
    setLoading(true);
    try {
      const isoDate = combineDateAndTime(form.date, form.time);
      const timeFormatted = formatTime12Hour(form.time);

      await acctAddSale(currentUser.uid, accountId, {
        grams: parseFloat(form.grams),
        amount: parseFloat(form.amount),
        rate: form.rate ? parseFloat(form.rate) : null,
        date: isoDate,
        time: timeFormatted,
        notes: form.notes,
      });
      toast.success('Gold sale recorded');
      setForm({
        grams: '',
        amount: '',
        rate: '',
        date: getCurrentDateFormatted(),
        time: getCurrentTimeFormatted(),
        notes: '',
      });
      fetchList();
      onUpdate?.();
    } catch {
      toast.error('Failed to add');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <GlowLoader label="Loading..." />;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117]">
      <div className="px-4 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${accent}ee, ${accent}99)` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/account/${accountId}`)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-white text-base font-bold">Sell Gold</h1>
            <p className="text-white/60 text-xs">{account?.name || 'Gold Account'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-6">
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in">
          <div className="h-0.5" style={{ backgroundColor: accent }} />
          <div className="p-4 space-y-3">
            {[
              { label: 'Grams Sold',  field: 'grams',  placeholder: '0.000', type: 'number' },
              { label: 'Rate / gram', field: 'rate',   placeholder: '₹ per gram', type: 'number' },
              { label: 'Total Amount (₹)', field: 'amount', placeholder: '0.00', type: 'number' },
            ].map(({ label, field, placeholder, type }) => (
              <div key={field}>
                <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest mb-1">{label}</p>
                <input type={type} placeholder={placeholder} value={form[field]}
                  onChange={e => field === 'grams' || field === 'rate' ? handleGramsOrRate(field, e.target.value) : setForm({ ...form, [field]: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] font-bold focus:outline-none transition-colors" />
              </div>
            ))}

            {/* Date & Time Picker in DD/MM/YYYY */}
            <DatePickerInput
              date={form.date}
              time={form.time}
              onDateChange={d => setForm({ ...form, date: d })}
              onTimeChange={t => setForm({ ...form, time: t })}
              accent={accent}
            />

            <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] resize-none focus:outline-none transition-colors" rows="2" />
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
              style={{ backgroundColor: accent }}>
              <TrendingDown className="w-4 h-4" />
              {loading ? 'Adding...' : 'Record Sale'}
            </button>
          </div>
        </div>

        {list.length > 0 && (
          <div className="space-y-2">
            {list.map((s, i) => (
              <div key={s.id} className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] p-3 flex items-center gap-3 animate-card-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}22` }}>
                  <TrendingDown className="w-4 h-4" style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8]">{parseFloat(s.grams).toFixed(3)}g sold</p>
                  <p className="text-[10px] text-[#8a9bb0]">{formatDateTime(s.date, s.time)}{s.rate ? ` · ₹${parseFloat(s.rate).toFixed(0)}/g` : ''}</p>
                </div>
                <p className="text-sm font-black text-[#4ade80] flex-shrink-0">+₹{parseFloat(s.amount).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
