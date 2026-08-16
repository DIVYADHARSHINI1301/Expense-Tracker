// ─── Dynamic account Firestore helpers ───────────────────────────────────────
// Each account stores data under: users/{uid}/accounts/{accountId}/{sub}
// Bank/Wallet: sub = 'income' | 'expenses'
// Gold:        sub = 'purchases' | 'sales'

import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const acctCol = (uid, accountId, sub) =>
  collection(db, 'users', uid, 'accounts', accountId, sub);

const acctDoc = (uid, accountId, sub, id) =>
  doc(db, 'users', uid, 'accounts', accountId, sub, id);

// ─── Bank / Wallet ────────────────────────────────────────────────────────────

export const acctAddIncome = (uid, accountId, data) =>
  addDoc(acctCol(uid, accountId, 'income'), { ...data, createdAt: serverTimestamp() });

export const acctGetIncome = async (uid, accountId) => {
  const snap = await getDocs(query(acctCol(uid, accountId, 'income'), orderBy('date', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const acctUpdateIncome = (uid, accountId, id, data) =>
  updateDoc(acctDoc(uid, accountId, 'income', id), data);

export const acctDeleteIncome = (uid, accountId, id) =>
  deleteDoc(acctDoc(uid, accountId, 'income', id));

export const acctAddExpense = (uid, accountId, data) =>
  addDoc(acctCol(uid, accountId, 'expenses'), { ...data, createdAt: serverTimestamp() });

export const acctGetExpenses = async (uid, accountId) => {
  const snap = await getDocs(query(acctCol(uid, accountId, 'expenses'), orderBy('date', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const acctUpdateExpense = (uid, accountId, id, data) =>
  updateDoc(acctDoc(uid, accountId, 'expenses', id), data);

export const acctDeleteExpense = (uid, accountId, id) =>
  deleteDoc(acctDoc(uid, accountId, 'expenses', id));

// ─── Gold ─────────────────────────────────────────────────────────────────────

export const acctAddPurchase = (uid, accountId, data) =>
  addDoc(acctCol(uid, accountId, 'purchases'), { ...data, createdAt: serverTimestamp() });

export const acctGetPurchases = async (uid, accountId) => {
  const snap = await getDocs(query(acctCol(uid, accountId, 'purchases'), orderBy('date', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const acctUpdatePurchase = (uid, accountId, id, data) =>
  updateDoc(acctDoc(uid, accountId, 'purchases', id), data);

export const acctDeletePurchase = (uid, accountId, id) =>
  deleteDoc(acctDoc(uid, accountId, 'purchases', id));

export const acctAddSale = (uid, accountId, data) =>
  addDoc(acctCol(uid, accountId, 'sales'), { ...data, createdAt: serverTimestamp() });

export const acctGetSales = async (uid, accountId) => {
  const snap = await getDocs(query(acctCol(uid, accountId, 'sales'), orderBy('date', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const acctUpdateSale = (uid, accountId, id, data) =>
  updateDoc(acctDoc(uid, accountId, 'sales', id), data);

export const acctDeleteSale = (uid, accountId, id) =>
  deleteDoc(acctDoc(uid, accountId, 'sales', id));
