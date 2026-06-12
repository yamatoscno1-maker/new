export type ShootingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export type ShootingCategory = 'portrait' | 'wedding' | 'commercial' | 'event' | 'landscape' | 'other';

export interface ShootingEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  location: string;
  client: string;
  category: ShootingCategory;
  status: ShootingStatus;
  notes: string;
  equipment: string[];
  fee: number;
}
