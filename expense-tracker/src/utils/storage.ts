import { Expense, Business } from '../types';

const KEY = 'expense-tracker-v1';

export function loadExpenses(): Expense[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(KEY, JSON.stringify(expenses));
}

export function mergeExpenses(existing: Expense[], incoming: Expense[]): Expense[] {
  const map = new Map(existing.map(e => [e.id, e]));
  for (const e of incoming) {
    if (!map.has(e.id)) map.set(e.id, e);
    // Preserve user-assigned business tags
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export function updateBusiness(expenses: Expense[], id: string, business: Business): Expense[] {
  return expenses.map(e => e.id === id ? { ...e, business } : e);
}
