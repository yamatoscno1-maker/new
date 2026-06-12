export type ShootingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export type ShootingCategory = 'portrait' | 'wedding' | 'commercial' | 'event' | 'landscape' | 'other';

export type AccountGroup = 'omnibus' | 'personal';

export interface Account {
  id: string;
  name: string;
  group: AccountGroup;
  color: string;
}

export interface ShootingEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  location: string;
  client: string;
  accountId: string;
  category: ShootingCategory;
  status: ShootingStatus;
  notes: string;
  equipment: string[];
  fee: number;
}
