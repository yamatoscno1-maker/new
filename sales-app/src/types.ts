export type AccountGroup = 'omnibus' | 'personal';

export interface Account {
  id: string;
  name: string;
  group: AccountGroup;
  color: string;
}

export interface SaleRecord {
  id: string;
  accountId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  memo: string;
}
