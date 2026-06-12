import React, { useState, useMemo } from 'react';
import { ShootingEvent } from '../types';
import './SalesDashboard.css';

interface Props {
  events: ShootingEvent[];
}

type Period = '7' | '30' | 'month' | '90' | '365' | 'custom';

const BRAND_COLORS = [
  '#f5c518', '#22c55e', '#94a3b8', '#a855f7', '#f97316',
  '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1',
  '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
];

function getPeriodRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (period === '7') {
    const from = new Date(today); from.setDate(today.getDate() - 6);
    return { from: fmt(from), to: fmt(today) };
  }
  if (period === '30') {
    const from = new Date(today); from.setDate(today.getDate() - 29);
    return { from: fmt(from), to: fmt(today) };
  }
  if (period === 'month') {
    return { from: fmt(today).slice(0, 7) + '-01', to: fmt(today) };
  }
  if (period === '90') {
    const from = new Date(today); from.setDate(today.getDate() - 89);
    return { from: fmt(from), to: fmt(today) };
  }
  if (period === '365') {
    const from = new Date(today); from.setFullYear(today.getFullYear() - 1);
    return { from: fmt(from), to: fmt(today) };
  }
  return { from: customFrom, to: customTo };
}

const periodLabels: Record<Period, string> = {
  '7': '7日', '30': '30日', month: '今月', '90': '90日', '365': '1年', custom: 'カスタム',
};

export const SalesDashboard: React.FC<Props> = ({ events }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [lastUpdated] = useState(() => {
    const now = new Date();
    return `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  const { from, to } = getPeriodRange(period, customFrom, customTo);

  const filtered = useMemo(() =>
    events.filter(e =>
      e.status === 'completed' &&
      e.fee > 0 &&
      e.date >= from &&
      e.date <= to
    ), [events, from, to]);

  const totalSales = useMemo(() => filtered.reduce((s, e) => s + e.fee, 0), [filtered]);

  const byClient = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(e => {
      map[e.client] = (map[e.client] || 0) + e.fee;
    });
    return Object.entries(map)
      .map(([client, fee]) => ({ client, fee }))
      .sort((a, b) => b.fee - a.fee);
  }, [filtered]);

  const periodDisplay = period === 'custom'
    ? `${customFrom} 〜 ${customTo}`
    : period === 'month'
      ? (() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-01 〜 ${new Date().toISOString().slice(0,10)}`; })()
      : `${from} 〜 ${to}`;

  return (
    <div className="sales-db">
      {/* Header bar */}
      <div className="sdb-header">
        <div className="sdb-title-row">
          <h2 className="sdb-title">売上ダッシュボード</h2>
          <button className="sdb-refresh-btn">売上を更新</button>
          <span className="sdb-last-updated">最終同期: {lastUpdated}</span>
        </div>
      </div>

      {/* Period selector */}
      <div className="sdb-period-bar">
        <div className="sdb-periods">
          {(Object.keys(periodLabels) as Period[]).map(p => (
            <button
              key={p}
              className={`sdb-period-btn${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="sdb-custom-range">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <span>〜</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </div>
        )}
        <span className="sdb-period-display">{periodDisplay}</span>
      </div>

      {/* Total cards */}
      <div className="sdb-total-cards">
        <div className="sdb-total-card">
          <div className="sdb-total-label">完了案件 売上合計</div>
          <div className="sdb-total-value">¥{totalSales.toLocaleString()}</div>
        </div>
        <div className="sdb-total-card">
          <div className="sdb-total-label">全クライアント 売上（合計）</div>
          <div className="sdb-total-value sdb-total-secondary">¥{totalSales.toLocaleString()}</div>
        </div>
      </div>

      {/* Brand grid */}
      <div className="sdb-brand-section">
        <div className="sdb-brand-header">
          <span className="sdb-brand-title">クライアント別 売上（期間内）</span>
          <span className="sdb-brand-total">合計 ¥{totalSales.toLocaleString()}</span>
        </div>

        {byClient.length === 0 ? (
          <div className="sdb-empty">この期間に完了した案件（売上あり）がありません</div>
        ) : (
          <div className="sdb-brand-grid">
            {byClient.map(({ client, fee }, i) => {
              const pct = totalSales > 0 ? (fee / totalSales) * 100 : 0;
              const color = BRAND_COLORS[i % BRAND_COLORS.length];
              return (
                <div className="sdb-brand-card" key={client}>
                  <div className="sdb-brand-card-header">
                    <span className="sdb-brand-dot" style={{ background: color }} />
                    <span className="sdb-brand-name">{client}</span>
                  </div>
                  <div className="sdb-brand-amount">¥{fee.toLocaleString()}</div>
                  <div className="sdb-brand-bar-track">
                    <div
                      className="sdb-brand-bar-fill"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <div className="sdb-brand-pct">全体の {pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
