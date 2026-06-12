import React from 'react';
import { ShootingEvent, ShootingCategory } from '../types';
import { statusLabel, statusColor, categoryLabel, categoryIcon } from '../utils';
import './Dashboard.css';

interface Props {
  events: ShootingEvent[];
}

export const Dashboard: React.FC<Props> = ({ events }) => {
  const now = new Date().toISOString().slice(0, 10);
  const thisMonth = now.slice(0, 7);

  const totalFee = events.filter(e => e.status === 'completed').reduce((s, e) => s + e.fee, 0);
  const upcoming = events.filter(e => e.date >= now && e.status !== 'cancelled').length;
  const thisMonthEvents = events.filter(e => e.date.startsWith(thisMonth));
  const completedCount = events.filter(e => e.status === 'completed').length;

  const byStatus = ['scheduled','confirmed','completed','cancelled'].map(s => ({
    label: statusLabel(s as any),
    color: statusColor(s as any),
    count: events.filter(e => e.status === s).length,
  }));

  const byCategory = (['portrait','wedding','commercial','event','landscape','other'] as ShootingCategory[]).map(c => ({
    label: categoryLabel(c),
    icon: categoryIcon(c),
    count: events.filter(e => e.category === c).length,
    fee: events.filter(e => e.category === c && e.status === 'completed').reduce((s, e) => s + e.fee, 0),
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const recentCompleted = events
    .filter(e => e.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const upcomingEvents = events
    .filter(e => e.date >= now && e.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="dashboard">
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-body">
            <div className="stat-value">{upcoming}</div>
            <div className="stat-label">今後の撮影</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-body">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">完了した撮影</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-body">
            <div className="stat-value">¥{totalFee.toLocaleString()}</div>
            <div className="stat-label">累計売上</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗓️</div>
          <div className="stat-body">
            <div className="stat-value">{thisMonthEvents.length}</div>
            <div className="stat-label">今月の撮影</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-card">
          <h3>ステータス別</h3>
          <div className="bar-chart">
            {byStatus.map(s => (
              <div key={s.label} className="bar-row">
                <div className="bar-label">{s.label}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: events.length ? `${(s.count / events.length) * 100}%` : '0',
                      background: s.color,
                    }}
                  />
                </div>
                <div className="bar-count">{s.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <h3>カテゴリ別</h3>
          {byCategory.length === 0 ? (
            <p className="no-data">データなし</p>
          ) : (
            <div className="category-list">
              {byCategory.map(c => (
                <div key={c.label} className="category-row">
                  <span className="cat-icon">{c.icon}</span>
                  <span className="cat-label">{c.label}</span>
                  <span className="cat-count">{c.count}件</span>
                  {c.fee > 0 && <span className="cat-fee">¥{c.fee.toLocaleString()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card">
          <h3>直近の完了</h3>
          {recentCompleted.length === 0 ? (
            <p className="no-data">完了した撮影はありません</p>
          ) : (
            <div className="recent-list">
              {recentCompleted.map(e => (
                <div key={e.id} className="recent-row">
                  <div className="recent-main">
                    <div className="recent-title">{e.title}</div>
                    <div className="recent-date">{e.date}</div>
                  </div>
                  {e.fee > 0 && <div className="recent-fee">¥{e.fee.toLocaleString()}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card">
          <h3>直近の予定</h3>
          {upcomingEvents.length === 0 ? (
            <p className="no-data">予定はありません</p>
          ) : (
            <div className="recent-list">
              {upcomingEvents.map(e => (
                <div key={e.id} className="recent-row">
                  <div className="recent-main">
                    <div className="recent-title">{e.title}</div>
                    <div className="recent-date">{e.date} {e.startTime}</div>
                  </div>
                  <div className="status-dot" style={{ background: statusColor(e.status) }} title={statusLabel(e.status)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
