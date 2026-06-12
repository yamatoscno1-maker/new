import React, { useState } from 'react';
import { Expense, Business, BUSINESS_LABELS, BUSINESS_COLORS } from '../types';
import './ExpenseList.css';

interface Props {
  expenses: Expense[];
  onUpdateBusiness: (id: string, business: Business) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  amex: 'Amex',
  upsider: 'UPSIDER',
  other: 'その他',
};

export function ExpenseList({ expenses, onUpdateBusiness }: Props) {
  const [filter, setFilter] = useState<Business | 'all'>('all');

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.business === filter);
  const businesses: Business[] = ['omnibus', 'produce', 'vtuber', 'unassigned'];

  return (
    <div className="expense-list">
      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          すべて ({expenses.length})
        </button>
        {businesses.map(b => (
          <button
            key={b}
            className={`filter-btn ${filter === b ? 'active' : ''}`}
            style={filter === b ? { borderColor: BUSINESS_COLORS[b], color: BUSINESS_COLORS[b] } : {}}
            onClick={() => setFilter(b)}
          >
            {BUSINESS_LABELS[b]} ({expenses.filter(e => e.business === b).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">明細がありません</div>
      ) : (
        <div className="expense-items">
          {filtered.map(expense => (
            <div key={expense.id} className="expense-item">
              <div className="expense-left">
                <div className="expense-merchant">{expense.merchant}</div>
                <div className="expense-meta">
                  <span className="expense-date">{expense.date}</span>
                  <span className="expense-source">{SOURCE_LABEL[expense.source]}</span>
                </div>
              </div>
              <div className="expense-right">
                <div className="expense-amount">¥{expense.amount.toLocaleString()}</div>
                <select
                  className="business-select"
                  value={expense.business}
                  style={{ borderColor: BUSINESS_COLORS[expense.business] }}
                  onChange={e => onUpdateBusiness(expense.id, e.target.value as Business)}
                >
                  {businesses.map(b => (
                    <option key={b} value={b}>{BUSINESS_LABELS[b]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
