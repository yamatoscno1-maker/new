export type Business = 'omnibus' | 'produce' | 'vtuber' | 'unassigned';

export const BUSINESS_LABELS: Record<Business, string> = {
  omnibus: 'オムニバス事業',
  produce: 'プロデュース事業',
  vtuber: 'Vtuber事業',
  unassigned: '未分類',
};

export const BUSINESS_COLORS: Record<Business, string> = {
  omnibus: '#6366f1',
  produce: '#f59e0b',
  vtuber: '#10b981',
  unassigned: '#9ca3af',
};

export type CardSource = 'amex' | 'upsider' | 'other';

export interface Expense {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  source: CardSource;
  business: Business;
  gmailThreadId: string;
  rawSubject: string;
}
