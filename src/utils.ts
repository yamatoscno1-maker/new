import { ShootingStatus, ShootingCategory } from './types';

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
