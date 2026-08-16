import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ─── ESAF (existing — unchanged) ─────────────────────────────────────────────

export const addIncome = async (userId, incomeData) => {
  const incomeRef = collection(db, 'users', userId, 'income');
  return await addDoc(incomeRef, { ...incomeData, createdAt: serverTimestamp() });
};

export const getIncome = async (userId) => {
  const incomeRef = collection(db, 'users', userId, 'income');
  const q = query(incomeRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteIncome = async (userId, incomeId) => {
  return await deleteDoc(doc(db, 'users', userId, 'income', incomeId));
};

export const updateIncome = async (userId, incomeId, incomeData) => {
  return await updateDoc(doc(db, 'users', userId, 'income', incomeId), incomeData);
};

export const addExpense = async (userId, expenseData) => {
  const expenseRef = collection(db, 'users', userId, 'expenses');
  return await addDoc(expenseRef, { ...expenseData, createdAt: serverTimestamp() });
};

export const getExpenses = async (userId) => {
  const expenseRef = collection(db, 'users', userId, 'expenses');
  const q = query(expenseRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateExpense = async (userId, expenseId, expenseData) => {
  return await updateDoc(doc(db, 'users', userId, 'expenses', expenseId), expenseData);
};

export const deleteExpense = async (userId, expenseId) => {
  return await deleteDoc(doc(db, 'users', userId, 'expenses', expenseId));
};

export const saveBudget = async (userId, budgetAmount) => {
  const budgetRef = collection(db, 'users', userId, 'settings');
  const q = query(budgetRef, where('type', '==', 'budget'));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return await addDoc(budgetRef, { type: 'budget', amount: budgetAmount, updatedAt: serverTimestamp() });
  } else {
    return await updateDoc(doc(db, 'users', userId, 'settings', snapshot.docs[0].id), {
      amount: budgetAmount, updatedAt: serverTimestamp()
    });
  }
};

export const getBudget = async (userId) => {
  const budgetRef = collection(db, 'users', userId, 'settings');
  const q = query(budgetRef, where('type', '==', 'budget'));
  const snapshot = await getDocs(q);
  return snapshot.empty ? 0 : snapshot.docs[0].data().amount || 0;
};

export const calculateTotalIncome = (incomeList) =>
  incomeList.reduce((total, item) => total + parseFloat(item.amount || 0), 0);

export const calculateTotalExpenses = (expenseList) =>
  expenseList.reduce((total, item) => total + parseFloat(item.amount || 0), 0);

export const calculateBalance = (incomeList, expenseList) =>
  calculateTotalIncome(incomeList) - calculateTotalExpenses(expenseList);

export const calculateSavingsPercentage = (incomeList, expenseList) => {
  const income = calculateTotalIncome(incomeList);
  const balance = calculateBalance(incomeList, expenseList);
  return income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
};

export const clearAllData = async (userId) => {
  try {
    const expenseRef = collection(db, 'users', userId, 'expenses');
    const expenseSnapshot = await getDocs(expenseRef);
    const incomeRef = collection(db, 'users', userId, 'income');
    const incomeSnapshot = await getDocs(incomeRef);
    await Promise.all([
      ...expenseSnapshot.docs.map(d => deleteDoc(d.ref)),
      ...incomeSnapshot.docs.map(d => deleteDoc(d.ref)),
    ]);
    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

// ─── WALLET (new — separate Firestore sub-collections) ───────────────────────

export const addWalletIncome = async (userId, data) => {
  return await addDoc(collection(db, 'users', userId, 'walletIncome'), {
    ...data, createdAt: serverTimestamp()
  });
};

export const getWalletIncome = async (userId) => {
  const q = query(collection(db, 'users', userId, 'walletIncome'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateWalletIncome = async (userId, id, data) =>
  await updateDoc(doc(db, 'users', userId, 'walletIncome', id), data);

export const deleteWalletIncome = async (userId, id) =>
  await deleteDoc(doc(db, 'users', userId, 'walletIncome', id));

export const addWalletExpense = async (userId, data) => {
  return await addDoc(collection(db, 'users', userId, 'walletExpenses'), {
    ...data, createdAt: serverTimestamp()
  });
};

export const getWalletExpenses = async (userId) => {
  const q = query(collection(db, 'users', userId, 'walletExpenses'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateWalletExpense = async (userId, id, data) =>
  await updateDoc(doc(db, 'users', userId, 'walletExpenses', id), data);

export const deleteWalletExpense = async (userId, id) =>
  await deleteDoc(doc(db, 'users', userId, 'walletExpenses', id));

// ─── GOLD (new — separate Firestore sub-collections) ─────────────────────────

export const addGoldPurchase = async (userId, data) => {
  return await addDoc(collection(db, 'users', userId, 'goldPurchases'), {
    ...data, createdAt: serverTimestamp()
  });
};

export const getGoldPurchases = async (userId) => {
  const q = query(collection(db, 'users', userId, 'goldPurchases'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateGoldPurchase = async (userId, id, data) =>
  await updateDoc(doc(db, 'users', userId, 'goldPurchases', id), data);

export const deleteGoldPurchase = async (userId, id) =>
  await deleteDoc(doc(db, 'users', userId, 'goldPurchases', id));

export const addGoldSale = async (userId, data) => {
  return await addDoc(collection(db, 'users', userId, 'goldSales'), {
    ...data, createdAt: serverTimestamp()
  });
};

export const getGoldSales = async (userId) => {
  const q = query(collection(db, 'users', userId, 'goldSales'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateGoldSale = async (userId, id, data) =>
  await updateDoc(doc(db, 'users', userId, 'goldSales', id), data);

export const deleteGoldSale = async (userId, id) =>
  await deleteDoc(doc(db, 'users', userId, 'goldSales', id));
