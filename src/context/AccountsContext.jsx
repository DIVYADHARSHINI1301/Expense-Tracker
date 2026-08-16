import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

// ─── Account type themes ──────────────────────────────────────────────────────
export const ACCOUNT_THEMES = {
  bank:   { accent: '#4a9eff', label: 'Bank Account',    icon: 'bank'   },
  wallet: { accent: '#8b5cf6', label: 'Wallet / Cash',   icon: 'wallet' },
  gold:   { accent: '#f59e0b', label: 'Gold Savings',    icon: 'gold'   },
};

// Accent color presets user can pick
export const ACCENT_PRESETS = [
  '#4a9eff', '#8b5cf6', '#f59e0b', '#10b981',
  '#f43f5e', '#06b6d4', '#f97316', '#a855f7',
];

const AccountsContext = createContext();

export const useAccounts = () => {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider');
  return ctx;
};

export const AccountsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!currentUser) { setAccounts([]); setLoading(false); return; }
    try {
      const q = query(
        collection(db, 'users', currentUser.uid, 'accounts'),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('fetchAccounts:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const addAccount = async ({ name, type, accent }) => {
    if (!currentUser) return;
    const data = {
      name: name.trim(),
      type,                          // 'bank' | 'wallet' | 'gold'
      accent: accent || ACCOUNT_THEMES[type]?.accent || '#4a9eff',
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'users', currentUser.uid, 'accounts'), data);
    await fetchAccounts();
    return ref.id;
  };

  const deleteAccount = async (accountId) => {
    if (!currentUser) return;
    await deleteDoc(doc(db, 'users', currentUser.uid, 'accounts', accountId));
    await fetchAccounts();
  };

  return (
    <AccountsContext.Provider value={{ accounts, loading, addAccount, deleteAccount, refetch: fetchAccounts }}>
      {children}
    </AccountsContext.Provider>
  );
};
