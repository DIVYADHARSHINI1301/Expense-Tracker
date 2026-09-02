import { useState, useEffect } from 'react';
import { X, Check, FileText, Briefcase, Monitor, Building2, TrendingUp, Gift, MoreHorizontal, DollarSign, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { acctUpdateIncome, acctUpdateExpense, acctDeleteIncome, acctDeleteExpense } from '../firebase/accountFirestore';
import { combineDateAndTime, formatDateDDMMYYYY, formatTime12Hour, getCurrentDateFormatted, getCurrentTimeFormatted } from '../utils/dateUtils';
import CategoryDropdown from './CategoryDropdown';
import PaymentDropdown from './PaymentDropdown';
import DatePickerInput from './DatePickerInput';
import toast from 'react-hot-toast';

const INCOME_SOURCES = [
  { key: 'Salary',      icon: Briefcase      },
  { key: 'Freelancing', icon: Monitor        },
  { key: 'Business',    icon: Building2      },
  { key: 'Investment',  icon: TrendingUp     },
  { key: 'Gift',        icon: Gift           },
  { key: 'Other',       icon: MoreHorizontal },
];

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  accountId,
  accountType = 'bank',
  accent = '#4a9eff',
  onSuccess,
  onDeleteSuccess,
}) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    source: 'Salary',
    amount: '',
    category: 'Food',
    paymentMethod: accountType === 'wallet' ? 'Cash' : 'UPI',
    date: getCurrentDateFormatted(),
    time: getCurrentTimeFormatted(),
    notes: '',
    description: '',
  });

  const isIncome = transaction?.txType === 'income' || (!transaction?.txType && !transaction?.category);

  useEffect(() => {
    if (transaction && isOpen) {
      const rawDate = transaction.date ? transaction.date.split('T')[0] : getCurrentDateFormatted();
      let rawTime = transaction.time;
      if (!rawTime && transaction.date && transaction.date.includes('T')) {
        const timePart = transaction.date.split('T')[1]?.substring(0, 5);
        if (timePart && timePart !== '00:00') rawTime = timePart;
      }
      if (!rawTime) rawTime = getCurrentTimeFormatted();

      const isKnownSource = INCOME_SOURCES.some(s => s.key === transaction.source);

      setForm({
        title: transaction.title || '',
        source: isKnownSource ? transaction.source : (transaction.source ? 'Other' : 'Salary'),
        amount: transaction.amount ? String(transaction.amount) : '',
        category: transaction.category || 'Food',
        paymentMethod: transaction.paymentMethod || (accountType === 'wallet' ? 'Cash' : 'UPI'),
        date: rawDate,
        time: rawTime,
        notes: transaction.notes || '',
        description: !isKnownSource && transaction.source ? transaction.source : (transaction.description || ''),
      });
    }
  }, [transaction, isOpen, accountType]);

  if (!isOpen || !transaction) return null;

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (isIncome) {
      if (form.source === 'Other' && !form.description.trim()) {
        toast.error('Please describe the income source');
        return;
      }
    } else {
      if (!form.title.trim()) {
        toast.error('Please enter an expense title');
        return;
      }
    }

    setLoading(true);
    try {
      const isoDate = combineDateAndTime(form.date, form.time);
      const timeFormatted = formatTime12Hour(form.time);

      if (isIncome) {
        const incomeSource = form.source === 'Other' ? form.description.trim() : form.source;
        const payload = {
          source: incomeSource,
          amount: parseFloat(form.amount),
          date: isoDate,
          time: timeFormatted,
          description: form.description.trim(),
        };
        await acctUpdateIncome(currentUser.uid, accountId, transaction.id, payload);
        toast.success('Income updated');
        onSuccess?.({ ...transaction, ...payload });
      } else {
        const payload = {
          title: form.title.trim(),
          amount: parseFloat(form.amount),
          category: form.category,
          paymentMethod: accountType === 'wallet' ? 'Cash' : form.paymentMethod,
          date: isoDate,
          time: timeFormatted,
          notes: form.notes.trim(),
        };
        await acctUpdateExpense(currentUser.uid, accountId, transaction.id, payload);
        toast.success('Expense updated');
        onSuccess?.({ ...transaction, ...payload });
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setDeleting(true);
    try {
      if (isIncome) {
        await acctDeleteIncome(currentUser.uid, accountId, transaction.id);
      } else {
        await acctDeleteExpense(currentUser.uid, accountId, transaction.id);
      }
      toast.success('Transaction deleted');
      onDeleteSuccess?.(transaction);
      onClose();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#161d27] rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-[#1e2a38] overflow-hidden animate-pop-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-1.5" style={{ backgroundColor: accent }} />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-[#1e2a38]">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Edit {isIncome ? 'Income' : 'Expense'}
            </h2>
            <p className="text-[10px] text-[#8a9bb0]">Make changes anytime</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white active:scale-90 transition-transform"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Amount input */}
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm"
              style={{ color: isIncome ? accent : '#f87171' }}
            >
              ₹
            </span>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] text-base font-bold focus:outline-none transition-colors"
            />
          </div>

          {isIncome ? (
            /* Income Sources */
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-wider">Source</p>
              <div className="grid grid-cols-3 gap-1.5">
                {INCOME_SOURCES.map(({ key, icon: Icon }) => {
                  const active = form.source === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, source: key })}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all duration-150 active:scale-95 ${
                        active
                          ? 'border-[#4a9eff] bg-[#eef6ff] dark:bg-[#1a2a3e]'
                          : 'border-[#e8ecf0] dark:border-[#1e2a38] bg-[#f8fafc] dark:bg-[#1a2332]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#4a9eff]' : 'text-[#8a9bb0]'}`} />
                      <span className={`text-[10px] font-semibold ${active ? 'text-[#4a9eff]' : 'text-[#8a9bb0]'}`}>
                        {key}
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.source === 'Other' && (
                <div className="relative mt-2">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Describe income source"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Expense Specific Fields */
            <div className="space-y-3">
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9bb0] w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Expense title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none"
                />
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-wider mb-1">Category</p>
                <CategoryDropdown
                  value={form.category}
                  onChange={(cat) => setForm({ ...form, category: cat })}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-wider mb-1">Payment Method</p>
                <PaymentDropdown
                  value={form.paymentMethod}
                  onChange={(m) => setForm({ ...form, paymentMethod: m })}
                  accountType={accountType}
                />
              </div>
            </div>
          )}

          {/* Date & Time Picker in DD/MM/YYYY */}
          <DatePickerInput
            date={form.date}
            time={form.time}
            onDateChange={(d) => setForm({ ...form, date: d })}
            onTimeChange={(t) => setForm({ ...form, time: t })}
            accent={accent}
          />

          {/* Notes for Expense */}
          {!isIncome && (
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] resize-none focus:outline-none"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-100 dark:border-[#1e2a38] flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || loading}
            className="px-3.5 py-2.5 rounded-xl bg-[#fff5f5] dark:bg-[#3a1a1a] text-[#f87171] font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || deleting}
            className="flex-1 py-2.5 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
            style={{ backgroundColor: accent }}
          >
            <Check className="w-3.5 h-3.5" />
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
