import { ShootingStatus, ShootingCategory, InvoiceStatus } from './types';

export const statusColor = (status: ShootingStatus): string => {
  switch (status) {
    case 'scheduled': return '#48bb78';
    case 'confirmed': return '#3182ce';
    case 'completed': return '#718096';
    case 'cancelled': return '#fc8181';
  }
};

export const statusLabel = (status: ShootingStatus): string => {
  switch (status) {
    case 'scheduled': return '予定';
    case 'confirmed': return '確定';
    case 'completed': return '完了';
    case 'cancelled': return 'キャンセル';
  }
};

export const categoryLabel = (cat: ShootingCategory): string => {
  switch (cat) {
    case 'portrait': return 'ポートレート';
    case 'wedding': return 'ウェディング';
    case 'commercial': return '商業';
    case 'event': return 'イベント';
    case 'landscape': return '風景';
    case 'other': return 'その他';
  }
};

export const invoiceStatusLabel = (s: InvoiceStatus): string => {
  switch (s) {
    case 'not_issued': return '請求書発行待ち';
    case 'issued': return '請求書発行済み';
    case 'paid': return '振り込み済み';
  }
};

export const invoiceStatusColor = (s: InvoiceStatus): string => {
  switch (s) {
    case 'not_issued': return '#ed8936';
    case 'issued': return '#3182ce';
    case 'paid': return '#48bb78';
  }
};

export const categoryIcon = (cat: ShootingCategory): string => {
  switch (cat) {
    case 'portrait': return '👤';
    case 'wedding': return '💒';
    case 'commercial': return '🏢';
    case 'event': return '🎉';
    case 'landscape': return '🌄';
    case 'other': return '📷';
  }
};
