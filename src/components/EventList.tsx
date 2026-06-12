import React, { useState } from 'react';
import { ShootingEvent, ShootingStatus, ShootingCategory } from '../types';
import { statusColor, statusLabel, categoryLabel, categoryIcon } from '../utils';
import './EventList.css';

interface Props {
  events: ShootingEvent[];
  onEventClick: (event: ShootingEvent) => void;
  onAdd: () => void;
}

export const EventList: React.FC<Props> = ({ events, onEventClick, onAdd }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ShootingStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ShootingCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'fee'>('date');

  const filtered = events
    .filter(e => {
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (search && !e.title.includes(search) && !e.client.includes(search) && !e.location.includes(search)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return a.date < b.date ? -1 : 1;
      return b.fee - a.fee;
    });

  return (
    <div className="event-list">
      <div className="list-toolbar">
        <input
          className="search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 タイトル・クライアント・場所で検索"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
          <option value="all">すべてのステータス</option>
          {(['scheduled','confirmed','completed','cancelled'] as ShootingStatus[]).map(s => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)}>
          <option value="all">すべてのカテゴリ</option>
          {(['portrait','wedding','commercial','event','landscape','other'] as ShootingCategory[]).map(c => (
            <option key={c} value={c}>{categoryLabel(c)}</option>
          ))}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="date">日付順</option>
          <option value="fee">料金順</option>
        </select>
      </div>

      <div className="list-info">{filtered.length}件</div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <p>撮影予定がありません</p>
          <button className="add-btn" onClick={onAdd}>最初の撮影を追加</button>
        </div>
      ) : (
        <div className="list-items">
          {filtered.map(ev => (
            <div key={ev.id} className="list-item" onClick={() => onEventClick(ev)}>
              <div className="list-item-status" style={{ background: statusColor(ev.status) }} />
              <div className="list-item-icon">{categoryIcon(ev.category)}</div>
              <div className="list-item-main">
                <div className="list-item-title">{ev.title}</div>
                <div className="list-item-meta">
                  <span>📅 {ev.date}</span>
                  <span>⏰ {ev.startTime}〜{ev.endTime}</span>
                  {ev.location && <span>📍 {ev.location}</span>}
                  {ev.client && <span>👤 {ev.client}</span>}
                </div>
              </div>
              <div className="list-item-right">
                <span className="status-badge" style={{ background: statusColor(ev.status) + '22', color: statusColor(ev.status) }}>
                  {statusLabel(ev.status)}
                </span>
                {ev.fee > 0 && <span className="fee">¥{ev.fee.toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
