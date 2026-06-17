import React, { useState } from 'react';
import { ShootingEvent, InvoiceStatus } from '../types';
import { invoiceStatusLabel, invoiceStatusColor, categoryIcon } from '../utils';
import './InvoiceSummary.css';

interface Props {
  events: ShootingEvent[];
  onUpdateInvoiceStatus: (id: string, invoiceStatus: InvoiceStatus) => void;
}

const INVOICE_STATUSES: InvoiceStatus[] = ['not_issued', 'issued', 'paid'];

export const InvoiceSummary: React.FC<Props> = ({ events, onUpdateInvoiceStatus }) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');

  const completedEvents = events.filter(e => e.status === 'completed' && e.fee > 0);

  const months = Array.from(
    new Set(completedEvents.map(e => e.date.slice(0, 7)))
  ).sort((a, b) => b.localeCompare(a));

  const monthEvents = completedEvents.filter(e => e.date.startsWith(selectedMonth));
  const filtered = filterStatus === 'all' ? monthEvents : monthEvents.filter(e => (e.invoiceStatus ?? 'not_issued') === filterStatus);

  const monthTotal = monthEvents.reduce((s, e) => s + e.fee, 0);
  const paidTotal = monthEvents.filter(e => e.invoiceStatus === 'paid').reduce((s, e) => s + e.fee, 0);
  const issuedTotal = monthEvents.filter(e => e.invoiceStatus === 'issued').reduce((s, e) => s + e.fee, 0);
  const notIssuedTotal = monthEvents.filter(e => !e.invoiceStatus || e.invoiceStatus === 'not_issued').reduce((s, e) => s + e.fee, 0);

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-');
    return `${y}年${parseInt(mo)}月`;
  };

  return (
    <div className="invoice-summary">
      <div className="invoice-header">
        <div className="month-selector">
          <label>月を選択</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>
        </div>
        <div className="invoice-filter">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            すべて
          </button>
          {INVOICE_STATUSES.map(s => (
            <button
              key={s}
              className={`filter-btn ${filterStatus === s ? 'active' : ''}`}
              style={filterStatus === s ? { background: invoiceStatusColor(s), borderColor: invoiceStatusColor(s) } : {}}
              onClick={() => setFilterStatus(s)}
            >
              {invoiceStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="invoice-stats">
        <div className="inv-stat-card">
          <div className="inv-stat-label">月合計</div>
          <div className="inv-stat-value">¥{monthTotal.toLocaleString()}</div>
          <div className="inv-stat-sub">{monthEvents.length}件</div>
        </div>
        <div className="inv-stat-card not-issued">
          <div className="inv-stat-label">請求書発行待ち</div>
          <div className="inv-stat-value">¥{notIssuedTotal.toLocaleString()}</div>
          <div className="inv-stat-sub">{monthEvents.filter(e => !e.invoiceStatus || e.invoiceStatus === 'not_issued').length}件</div>
        </div>
        <div className="inv-stat-card issued">
          <div className="inv-stat-label">請求書発行済み</div>
          <div className="inv-stat-value">¥{issuedTotal.toLocaleString()}</div>
          <div className="inv-stat-sub">{monthEvents.filter(e => e.invoiceStatus === 'issued').length}件</div>
        </div>
        <div className="inv-stat-card paid">
          <div className="inv-stat-label">振り込み済み</div>
          <div className="inv-stat-value">¥{paidTotal.toLocaleString()}</div>
          <div className="inv-stat-sub">{monthEvents.filter(e => e.invoiceStatus === 'paid').length}件</div>
        </div>
      </div>

      {months.length === 0 ? (
        <div className="invoice-empty">完了した撮影（金額あり）がまだありません</div>
      ) : filtered.length === 0 ? (
        <div className="invoice-empty">該当する撮影はありません</div>
      ) : (
        <div className="invoice-table">
          <div className="invoice-table-header">
            <span>日付</span>
            <span>クライアント / タイトル</span>
            <span>カテゴリ</span>
            <span>金額</span>
            <span>請求書ステータス</span>
          </div>
          {filtered
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(e => {
              const invStatus: InvoiceStatus = e.invoiceStatus ?? 'not_issued';
              return (
                <div key={e.id} className="invoice-row">
                  <span className="inv-date">{e.date.slice(5).replace('-', '/')}</span>
                  <span className="inv-title">
                    <span className="inv-client">{e.client || '—'}</span>
                    <span className="inv-name">{e.title}</span>
                  </span>
                  <span className="inv-cat">{categoryIcon(e.category)}</span>
                  <span className="inv-fee">¥{e.fee.toLocaleString()}</span>
                  <span className="inv-status-cell">
                    <select
                      className="inv-status-select"
                      value={invStatus}
                      style={{ borderColor: invoiceStatusColor(invStatus), color: invoiceStatusColor(invStatus) }}
                      onChange={ev => onUpdateInvoiceStatus(e.id, ev.target.value as InvoiceStatus)}
                    >
                      {INVOICE_STATUSES.map(s => (
                        <option key={s} value={s}>{invoiceStatusLabel(s)}</option>
                      ))}
                    </select>
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
