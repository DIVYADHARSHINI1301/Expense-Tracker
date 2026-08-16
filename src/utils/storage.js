// LocalStorage utility functions
const STORAGE_KEYS = {
  INCOME: 'expense_tracker_income',
  EXPENSES: 'expense_tracker_expenses',
  BUDGET: 'expense_tracker_budget'
};

export const getIncome = () => {
  const income = localStorage.getItem(STORAGE_KEYS.INCOME);
  return income ? JSON.parse(income) : [];
};

export const saveIncome = (incomeData) => {
  localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(incomeData));
};

export const getExpenses = () => {
  const expenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  return expenses ? JSON.parse(expenses) : [];
};

export const saveExpenses = (expensesData) => {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expensesData));
};

export const getBudget = () => {
  const budget = localStorage.getItem(STORAGE_KEYS.BUDGET);
  return budget ? parseFloat(budget) : 0;
};

export const saveBudget = (budgetAmount) => {
  localStorage.setItem(STORAGE_KEYS.BUDGET, budgetAmount.toString());
};

export const calculateTotalIncome = () => {
  const income = getIncome();
  return income.reduce((total, item) => total + parseFloat(item.amount), 0);
};

export const calculateTotalExpenses = () => {
  const expenses = getExpenses();
  return expenses.reduce((total, item) => total + parseFloat(item.amount), 0);
};

export const calculateBalance = () => {
  return calculateTotalIncome() - calculateTotalExpenses();
};

export const calculateSavingsPercentage = () => {
  const income = calculateTotalIncome();
  const balance = calculateBalance();
  return income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
};
