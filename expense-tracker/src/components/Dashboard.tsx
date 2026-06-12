import React, { useMemo } from 'react';
import { Expense, Business, BUSINESS_LABELS, BUSINESS_COLORS } from '../types';
import './Dashboard.css';

interface Props {
  expenses: Expense[];
}

export function Dashboard({ expenses }: Props) {
  const byBusiness = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.business] = (map[e.business] ?? 0) + e.amount;
    }
    return map;
  }, [expenses]);

  const total = Object.values(byBusiness).reduce((a, b) => a + b, 0);

  const byMonth = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const e of expenses) {
      const month = e.date.slice(0, 7);
      if (!map[month]) map[month] = {};
      map[month][e.business] = (map[month][e.business] ?? 0) + e.amount;
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6);
  }, [expenses]);

  const businesses: Business[] = ['omnibus', 'produce', 'vtuber', 'unassigned'];

  return (
    <div className="dashboard">
      <div className="summary-cards">
        {businesses.map(biz => (
          <div key={biz} className="summary-card" style={{ borderTop: `3px solid ${BUSINESS_COLORS[biz]}` }}>
            <div className="summary-label">{BUSINESS_LABELS[biz]}</div>
            <div className="summary-amount">¥{(byBusiness[biz] ?? 0).toLocaleString()}</div>
            <div className="summary-pct">
              {total > 0 ? Math.round((byBusiness[biz] ?? 0) / total * 100) : 0}%
            </div>
          </div>
        ))}
      </div>

      <div className="total-bar">
        合計: <strong>¥{total.toLocaleString()}</strong>
        {expenses.filter(e => e.business === 'unassigned').length > 0 && (
          <span className="unassigned-warn">
            ⚠ 未分類 {expenses.filter(e => e.business === 'unassigned').length}件
          </span>
        )}
      </div>

      <div className="month-table-wrap">
        <h3>月別・事業別</h3>
        <table className="month-table">
          <thead>
            <tr>
              <th>月</th>
              {businesses.filter(b => b !== 'unassigned').map(b => (
                <th key={b} style={{ color: BUSINESS_COLORS[b] }}>{BUSINESS_LABELS[b]}</th>
              ))}
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            {byMonth.map(([month, data]) => {
              const rowTotal = Object.values(data).reduce((a, b) => a + b, 0);
              return (
                <tr key={month}>
                  <td>{month}</td>
                  {businesses.filter(b => b !== 'unassigned').map(b => (
                    <td key={b}>¥{(data[b] ?? 0).toLocaleString()}</td>
                  ))}
                  <td><strong>¥{rowTotal.toLocaleString()}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
