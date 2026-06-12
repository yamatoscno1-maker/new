import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShootingEvent, Account, AccountGroup } from '../types';
import './SalesDashboard.css';

interface Props {
  events: ShootingEvent[];
  accounts: Account[];
  onAddAccount: (a: Account) => void;
  onUpdateAccount: (a: Account) => void;
  onDeleteAccount: (id: string) => void;
}

type Period = 'today' | 'yesterday' | 'month' | 'lastmonth' | '365' | 'custom';
type GroupFilter = 'all' | 'omnibus' | 'personal';

const COLORS = [
  '#f5c518','#22c55e','#94a3b8','#a855f7','#f97316',
  '#3b82f6','#ec4899','#14b8a6','#f59e0b','#6366f1',
  '#10b981','#ef4444','#8b5cf6','#06b6d4','#84cc16',
];

const GROUP_LABELS: Record<AccountGroup, string> = {
  omnibus: 'オムニバス事業',
  personal: '個人アカウント',
};

function getPeriodRange(period: Period, customFrom: string, customTo: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (period === 'today') {
    return { from: fmt(today), to: fmt(today) };
  }
  if (period === 'yesterday') {
    const y = new Date(today); y.setDate(today.getDate() - 1);
    return { from: fmt(y), to: fmt(y) };
  }
  if (period === 'month') {
    return { from: fmt(today).slice(0, 7) + '-01', to: fmt(today) };
  }
  if (period === 'lastmonth') {
    const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lme = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: fmt(lm), to: fmt(lme) };
  }
  if (period === '365') {
    const f = new Date(today); f.setFullYear(today.getFullYear() - 1);
    return { from: fmt(f), to: fmt(today) };
  }
  return { from: customFrom || fmt(today), to: customTo || fmt(today) };
}

const PERIOD_LABELS: Record<Period, string> = {
  today: '今日', yesterday: '昨日', month: '今月', lastmonth: '先月', '365': '1年', custom: 'カスタム',
};

export const SalesDashboard: React.FC<Props> = ({
  events, accounts, onAddAccount, onUpdateAccount, onDeleteAccount,
}) => {
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const { from, to } = getPeriodRange(period, customFrom, customTo);

  const periodDisplay = useMemo(() => {
    if (period === 'month') {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-01 〜 ${new Date().toISOString().slice(0,10)}`;
    }
    if (period === 'custom') return customFrom && customTo ? `${customFrom} 〜 ${customTo}` : '期間を選択';
    return `${from} 〜 ${to}`;
  }, [period, from, to, customFrom, customTo]);

  const filtered = useMemo(() =>
    events.filter(e => e.status === 'completed' && e.fee > 0 && e.date >= from && e.date <= to),
    [events, from, to]
  );

  const visibleAccounts = useMemo(() => {
    if (groupFilter === 'all') return accounts;
    return accounts.filter(a => a.group === groupFilter);
  }, [accounts, groupFilter]);

  const salesByAccount = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(e => {
      if (e.accountId) map[e.accountId] = (map[e.accountId] || 0) + e.fee;
    });
    return map;
  }, [filtered]);

  const totalSales = useMemo(() =>
    visibleAccounts.reduce((s, a) => s + (salesByAccount[a.id] || 0), 0),
    [visibleAccounts, salesByAccount]
  );

  const grandTotal = useMemo(() =>
    filtered.reduce((s, e) => s + e.fee, 0),
    [filtered]
  );

  const omnibusTotal = useMemo(() =>
    accounts.filter(a => a.group === 'omnibus').reduce((s, a) => s + (salesByAccount[a.id] || 0), 0),
    [accounts, salesByAccount]
  );

  const personalTotal = useMemo(() =>
    accounts.filter(a => a.group === 'personal').reduce((s, a) => s + (salesByAccount[a.id] || 0), 0),
    [accounts, salesByAccount]
  );

  const sortedAccounts = useMemo(() =>
    [...visibleAccounts].sort((a, b) => (salesByAccount[b.id] || 0) - (salesByAccount[a.id] || 0)),
    [visibleAccounts, salesByAccount]
  );

  const lastUpdated = useMemo(() => {
    const n = new Date();
    return `${n.getMonth()+1}/${n.getDate()} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  }, []);

  return (
    <div className="sales-db">
      {/* Header */}
      <div className="sdb-header">
        <div className="sdb-title-row">
          <h2 className="sdb-title">売上ダッシュボード</h2>
          <button className="sdb-refresh-btn">売上を更新</button>
          <span className="sdb-last-updated">最終同期: {lastUpdated}</span>
          <button className="sdb-manage-btn" onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}>
            ＋ アカウント管理
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="sdb-period-bar">
        <div className="sdb-periods">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button key={p} className={`sdb-period-btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
              {PERIOD_LABELS[p]}
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

      {/* Total summary cards */}
      <div className="sdb-total-cards">
        <div className="sdb-total-card sdb-total-main">
          <div className="sdb-total-label">全体 売上合計</div>
          <div className="sdb-total-value green">¥{grandTotal.toLocaleString()}</div>
        </div>
        <div className="sdb-total-card">
          <div className="sdb-total-label">オムニバス事業</div>
          <div className="sdb-total-value">¥{omnibusTotal.toLocaleString()}</div>
        </div>
        <div className="sdb-total-card">
          <div className="sdb-total-label">個人アカウント</div>
          <div className="sdb-total-value">¥{personalTotal.toLocaleString()}</div>
        </div>
      </div>

      {/* Group filter tabs */}
      <div className="sdb-group-tabs">
        {(['all', 'omnibus', 'personal'] as GroupFilter[]).map(g => (
          <button
            key={g}
            className={`sdb-group-tab${groupFilter === g ? ' active' : ''}`}
            onClick={() => setGroupFilter(g)}
          >
            {g === 'all' ? '全体' : GROUP_LABELS[g as AccountGroup]}
          </button>
        ))}
      </div>

      {/* Account cards */}
      <div className="sdb-brand-section">
        <div className="sdb-brand-header">
          <span className="sdb-brand-title">
            {groupFilter === 'all' ? '全アカウント' : GROUP_LABELS[groupFilter as AccountGroup]} 売上（期間内）
          </span>
          <span className="sdb-brand-total">合計 ¥{totalSales.toLocaleString()}</span>
        </div>

        {/* Group breakdown if "all" selected */}
        {groupFilter === 'all' && (
          <div className="sdb-group-sections">
            {(['omnibus', 'personal'] as AccountGroup[]).map(group => {
              const groupAccounts = [...accounts]
                .filter(a => a.group === group)
                .sort((a, b) => (salesByAccount[b.id] || 0) - (salesByAccount[a.id] || 0));
              const gTotal = groupAccounts.reduce((s, a) => s + (salesByAccount[a.id] || 0), 0);
              if (groupAccounts.length === 0) return null;
              return (
                <div key={group} className="sdb-group-block">
                  <div className="sdb-group-block-header">
                    <span className="sdb-group-block-title">{GROUP_LABELS[group]}</span>
                    <span className="sdb-group-block-total">¥{gTotal.toLocaleString()}</span>
                  </div>
                  <AccountGrid
                    accounts={groupAccounts}
                    salesByAccount={salesByAccount}
                    grandTotal={grandTotal}
                    onEdit={a => { setEditingAccount(a); setShowAccountModal(true); }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Flat grid for filtered view */}
        {groupFilter !== 'all' && (
          sortedAccounts.length === 0 ? (
            <div className="sdb-empty">アカウントがありません。「アカウント管理」から追加してください。</div>
          ) : (
            <AccountGrid
              accounts={sortedAccounts}
              salesByAccount={salesByAccount}
              grandTotal={grandTotal}
              onEdit={a => { setEditingAccount(a); setShowAccountModal(true); }}
            />
          )
        )}

        {accounts.length === 0 && (
          <div className="sdb-empty">
            アカウントがありません。「アカウント管理」から追加してください。
          </div>
        )}
      </div>

      {/* Account modal */}
      {showAccountModal && (
        <AccountModal
          account={editingAccount}
          onSave={a => {
            if (editingAccount) onUpdateAccount(a);
            else onAddAccount(a);
            setShowAccountModal(false);
          }}
          onDelete={editingAccount ? () => { onDeleteAccount(editingAccount.id); setShowAccountModal(false); } : undefined}
          onClose={() => setShowAccountModal(false)}
        />
      )}
    </div>
  );
};

/* ---- AccountGrid ---- */
interface GridProps {
  accounts: Account[];
  salesByAccount: Record<string, number>;
  grandTotal: number;
  onEdit: (a: Account) => void;
}
const AccountGrid: React.FC<GridProps> = ({ accounts, salesByAccount, grandTotal, onEdit }) => (
  <div className="sdb-brand-grid">
    {accounts.map((account, i) => {
      const fee = salesByAccount[account.id] || 0;
      const pct = grandTotal > 0 ? (fee / grandTotal) * 100 : 0;
      const color = account.color || COLORS[i % COLORS.length];
      return (
        <div className="sdb-brand-card" key={account.id} onClick={() => onEdit(account)}>
          <div className="sdb-brand-card-header">
            <span className="sdb-brand-dot" style={{ background: color }} />
            <span className="sdb-brand-name">{account.name}</span>
          </div>
          <div className="sdb-brand-amount">¥{fee.toLocaleString()}</div>
          <div className="sdb-brand-bar-track">
            <div className="sdb-brand-bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
          <div className="sdb-brand-pct">全体の {pct.toFixed(1)}%</div>
        </div>
      );
    })}
  </div>
);

/* ---- AccountModal ---- */
interface ModalProps {
  account: Account | null;
  onSave: (a: Account) => void;
  onDelete?: () => void;
  onClose: () => void;
}
const AccountModal: React.FC<ModalProps> = ({ account, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(account?.name || '');
  const [group, setGroup] = useState<AccountGroup>(account?.group || 'omnibus');
  const [color, setColor] = useState(account?.color || COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ id: account?.id || uuidv4(), name: name.trim(), group, color });
  };

  return (
    <div className="sdb-modal-backdrop" onClick={onClose}>
      <div className="sdb-modal" onClick={e => e.stopPropagation()}>
        <div className="sdb-modal-header">
          <h3>{account ? 'アカウントを編集' : 'アカウントを追加'}</h3>
          <button className="sdb-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="sdb-modal-body">
          <div className="sdb-form-group">
            <label>アカウント名 *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="例: SUTORE" />
          </div>
          <div className="sdb-form-group">
            <label>グループ</label>
            <div className="sdb-group-radio">
              {(['omnibus', 'personal'] as AccountGroup[]).map(g => (
                <label key={g} className={`sdb-radio-label${group === g ? ' selected' : ''}`}>
                  <input type="radio" name="group" value={g} checked={group === g} onChange={() => setGroup(g)} />
                  {GROUP_LABELS[g]}
                </label>
              ))}
            </div>
          </div>
          <div className="sdb-form-group">
            <label>カラー</label>
            <div className="sdb-color-picker">
              {COLORS.map(c => (
                <div
                  key={c}
                  className={`sdb-color-dot${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="sdb-modal-footer">
            {onDelete && (
              <button type="button" className="sdb-btn-delete" onClick={() => { if (window.confirm('削除しますか？')) onDelete!(); }}>
                削除
              </button>
            )}
            <div className="sdb-footer-right">
              <button type="button" className="sdb-btn-cancel" onClick={onClose}>キャンセル</button>
              <button type="submit" className="sdb-btn-save">保存</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
