import { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowLeft, FileText, Utensils, Plane, ShoppingBag, Receipt, Film, BookOpen, Heart, Package, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounts } from '../context/AccountsContext';
import { acctAddExpense, acctGetExpenses, acctGetIncome, acctDeleteExpense } from '../firebase/accountFirestore';
import { combineDateAndTime, formatDateTime, formatTime12Hour, getCurrentDateFormatted, getCurrentTimeFormatted, calculateRunningBalances } from '../utils/dateUtils';
import CategoryDropdown from './CategoryDropdown';
import PaymentDropdown from './PaymentDropdown';
import DatePickerInput from './DatePickerInput';
import EditTransactionModal from './EditTransactionModal';
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
  const isWallet = account?.type === 'wallet';
  const defaultPayment = isWallet ? 'Cash' : 'UPI';

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: getCurrentDateFormatted(),
    time: getCurrentTimeFormatted(),
    paymentMethod: defaultPayment,
    notes: '',
  });

  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(true);
  const [recentList, setRecentList] = useState([]);
  const [editingTx, setEditingTx]   = useState(null);

  // Sync payment method when account loads
  useEffect(() => {
    if (isWallet && form.paymentMethod !== 'Cash') {
      setForm(prev => ({ ...prev, paymentMethod: 'Cash' }));
    } else if (!isWallet && form.paymentMethod === 'Cash') {
      setForm(prev => ({ ...prev, paymentMethod: 'UPI' }));
    }
  }, [isWallet]);

  const fetchList = useCallback(async () => {
    if (!currentUser || !accountId) return;
    setFetching(true);
    try {
      const [incomeSnap, expenseSnap] = await Promise.all([
        acctGetIncome(currentUser.uid, accountId),
        acctGetExpenses(currentUser.uid, accountId),
      ]);

      const allWithBalances = calculateRunningBalances([
        ...expenseSnap.map(e => ({ ...e, txType: 'expense' })),
        ...incomeSnap.map(i => ({ ...i, txType: 'income' })),
      ]);

      const expensesWithBalances = allWithBalances
        .filter(t => t.txType === 'expense')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      setRecentList(expensesWithBalances);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [currentUser, accountId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount) {
      toast.error('Please enter title and amount');
      return;
    }
    if (parseFloat(form.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const isoDate = combineDateAndTime(form.date, form.time);
      const timeFormatted = formatTime12Hour(form.time);

      await acctAddExpense(currentUser.uid, accountId, {
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        paymentMethod: isWallet ? 'Cash' : form.paymentMethod,
        date: isoDate,
        time: timeFormatted,
        notes: form.notes.trim(),
      });

      toast.success('Expense added');
      setForm({
        title: '',
        amount: '',
        category: 'Food',
        date: getCurrentDateFormatted(),
        time: getCurrentTimeFormatted(),
        paymentMethod: defaultPayment,
        notes: '',
      });
      fetchList();
      onUpdate?.();
    } catch {
      toast.error('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tx) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await acctDeleteExpense(currentUser.uid, accountId, tx.id);
      toast.success('Deleted');
      fetchList();
      onUpdate?.();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (fetching) return <GlowLoader label="Loading expenses..." />;

  const meta = CAT_META[form.category] || CAT_META.Others;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117] overflow-x-hidden">
      {/* Header */}
      <div
        className="px-4 pt-5 pb-4 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${account?.accent || '#4a9eff'}ee, ${account?.accent || '#4a9eff'}99)` }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/account/${accountId}`)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-white text-base font-bold">Add Expense</h1>
            <p className="text-white/70 text-xs">{account?.name || 'Account'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-32">
        {/* Expense Form Card */}
        <div className="bg-white dark:bg-[#161d27] rounded-2xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-visible animate-card-in">
          <div className="h-0.5 transition-all duration-500" style={{ backgroundColor: meta.accent }} />
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Expense title (e.g. Grocery, Electricity)"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none transition-colors"
              />
            </div>

            {/* Amount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm z-10" style={{ color: meta.accent }}>₹</span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] text-base font-bold focus:outline-none transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest mb-1.5">Category</p>
              <CategoryDropdown value={form.category} onChange={cat => setForm({ ...form, category: cat })} />
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest mb-1.5">Payment Method</p>
              <PaymentDropdown
                value={form.paymentMethod}
                onChange={m => setForm({ ...form, paymentMethod: m })}
                accountType={account?.type}
              />
            </div>

            {/* Date & Time Picker in DD/MM/YYYY */}
            <DatePickerInput
              date={form.date}
              time={form.time}
              onDateChange={d => setForm({ ...form, date: d })}
              onTimeChange={t => setForm({ ...form, time: t })}
              accent={meta.accent}
            />

            {/* Notes */}
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] resize-none focus:outline-none transition-colors"
              rows="2"
            />

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
              style={{ backgroundColor: meta.accent }}
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Adding Expense...' : 'Add Expense'}
            </button>
          </div>
        </div>

        {/* Recent Expenses List with Running Balance & Edit Option */}
        {recentList.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 px-1">
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-widest">Recent Expenses</p>
              <div className="flex-1 h-px bg-[#e8ecf0] dark:bg-[#1e2a38]" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#f87171] bg-red-50 dark:bg-[#3a1a1a]">
                {recentList.length}
              </span>
            </div>

            {recentList.map((exp, idx) => {
              const m = CAT_META[exp.category] || CAT_META.Others;
              const EIcon = m.icon;
              return (
                <div
                  key={exp.id || idx}
                  className="bg-white dark:bg-[#161d27] rounded-xl border border-[#e8ecf0] dark:border-[#1e2a38] overflow-hidden animate-card-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${m.accent}22` }}>
                      <EIcon className="w-4 h-4" style={{ color: m.accent }} strokeWidth={1.8} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2d3748] dark:text-[#c8d8e8] truncate">
                        {exp.title}
                      </p>
                      <p className="text-[10px] text-[#8a9bb0] flex items-center gap-1.5 flex-wrap">
                        <span>{formatDateTime(exp.date, exp.time)}</span>
                        {exp.paymentMethod && (
                          <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-[#1e2a38] text-[9px] text-gray-500 dark:text-gray-400">
                            {exp.paymentMethod}
                          </span>
                        )}
                      </p>
                      {/* Running Current Balance under description */}
                      {exp.runningBalance !== undefined && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="text-[9px] font-medium text-[#8a9bb0]">Balance:</span>
                          <span className={`text-[10px] font-bold ${exp.runningBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            ₹{parseFloat(exp.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-sm font-black text-[#f87171]">
                        −₹{parseFloat(exp.amount).toLocaleString('en-IN')}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingTx(exp)}
                          className="w-6 h-6 rounded-lg bg-[#f4f6f8] dark:bg-[#1a2332] flex items-center justify-center text-[#6b7a8d] hover:text-[#4a9eff] active:scale-90 transition-all"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp)}
                          className="w-6 h-6 rounded-lg bg-[#fff5f5] dark:bg-[#3a1a1a] flex items-center justify-center text-[#f87171] hover:text-red-600 active:scale-90 transition-all"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <EditTransactionModal
          isOpen={!!editingTx}
          onClose={() => setEditingTx(null)}
          transaction={editingTx}
          accountId={accountId}
          accountType={account?.type}
          accent={account?.accent || '#4a9eff'}
          onSuccess={() => {
            fetchList();
            onUpdate?.();
          }}
          onDeleteSuccess={() => {
            fetchList();
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
}
export default AccountAddExpense;
