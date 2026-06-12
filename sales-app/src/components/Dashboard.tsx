import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Account, AccountGroup, SaleRecord } from '../types';
import './Dashboard.css';

type Period = '7' | '30' | 'month' | '90' | '365' | 'custom';
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

const PERIOD_LABELS: Record<Period, string> = {
  '7': '7日', '30': '30日', month: '今月', '90': '90日', '365': '1年', custom: 'カスタム',
};

function getPeriodRange(period: Period, cf: string, ct: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (period === '7') { const f = new Date(today); f.setDate(today.getDate()-6); return { from: fmt(f), to: fmt(today) }; }
  if (period === '30') { const f = new Date(today); f.setDate(today.getDate()-29); return { from: fmt(f), to: fmt(today) }; }
  if (period === 'month') { return { from: fmt(today).slice(0,7)+'-01', to: fmt(today) }; }
  if (period === '90') { const f = new Date(today); f.setDate(today.getDate()-89); return { from: fmt(f), to: fmt(today) }; }
  if (period === '365') { const f = new Date(today); f.setFullYear(today.getFullYear()-1); return { from: fmt(f), to: fmt(today) }; }
  return { from: cf || fmt(today), to: ct || fmt(today) };
}

interface Props {
  accounts: Account[];
  sales: SaleRecord[];
  onAddAccount: (a: Account) => void;
  onUpdateAccount: (a: Account) => void;
  onDeleteAccount: (id: string) => void;
  onAddSale: (s: SaleRecord) => void;
  onUpdateSale: (s: SaleRecord) => void;
  onDeleteSale: (id: string) => void;
}

export const Dashboard: React.FC<Props> = ({
  accounts, sales, onAddAccount, onUpdateAccount, onDeleteAccount,
  onAddSale, onUpdateSale, onDeleteSale,
}) => {
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [showAccModal, setShowAccModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [saleAccountId, setSaleAccountId] = useState('');

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
    sales.filter(s => s.date >= from && s.date <= to),
    [sales, from, to]
  );

  const salesByAccount = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => { map[s.accountId] = (map[s.accountId] || 0) + s.amount; });
    return map;
  }, [filtered]);

  const grandTotal = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered]);

  const omnibusTotal = useMemo(() =>
    accounts.filter(a => a.group === 'omnibus').reduce((s, a) => s + (salesByAccount[a.id] || 0), 0),
    [accounts, salesByAccount]
  );
  const personalTotal = useMemo(() =>
    accounts.filter(a => a.group === 'personal').reduce((s, a) => s + (salesByAccount[a.id] || 0), 0),
    [accounts, salesByAccount]
  );

  const visibleAccounts = useMemo(() =>
    groupFilter === 'all' ? accounts : accounts.filter(a => a.group === groupFilter),
    [accounts, groupFilter]
  );

  const visibleTotal = useMemo(() =>
    visibleAccounts.reduce((s, a) => s + (salesByAccount[a.id] || 0), 0),
    [visibleAccounts, salesByAccount]
  );

  const now = new Date();
  const lastUpdated = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const openAddSale = (accountId: string) => {
    setSaleAccountId(accountId);
    setEditingSale(null);
    setShowSaleModal(true);
  };

  return (
    <div className="db">
      {/* Topbar */}
      <div className="db-topbar">
        <div className="db-topbar-left">
          <span className="db-app-name">sales-analytics</span>
          <nav className="db-nav">
            <span className="db-nav-item active">ダッシュボード</span>
            <span className="db-nav-item" onClick={() => { setEditingAcc(null); setShowAccModal(true); }}>アカウント管理</span>
          </nav>
        </div>
        <div className="db-topbar-right">
          <span className="db-user">管理者</span>
        </div>
      </div>

      <div className="db-body">
        {/* Page header */}
        <div className="db-page-header">
          <div className="db-page-title-row">
            <h1 className="db-page-title">ダッシュボード</h1>
            <button className="db-refresh-btn">売上を更新</button>
            <span className="db-last-updated">最終同期: {lastUpdated}</span>
          </div>
        </div>

        {/* Period */}
        <div className="db-period-bar">
          <div className="db-periods">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button key={p} className={`db-period-btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="db-custom-range">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              <span>〜</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          )}
          <span className="db-period-display">{periodDisplay}</span>
        </div>

        {/* Summary */}
        <div className="db-summary-cards">
          <div className="db-summary-card main">
            <div className="db-summary-label">全体 売上合計</div>
            <div className="db-summary-value green">¥{grandTotal.toLocaleString()}</div>
          </div>
          <div className="db-summary-card">
            <div className="db-summary-label">オムニバス事業</div>
            <div className="db-summary-value">¥{omnibusTotal.toLocaleString()}</div>
          </div>
          <div className="db-summary-card">
            <div className="db-summary-label">個人アカウント</div>
            <div className="db-summary-value">¥{personalTotal.toLocaleString()}</div>
          </div>
        </div>

        {/* Group tabs */}
        <div className="db-group-tabs">
          {(['all','omnibus','personal'] as GroupFilter[]).map(g => (
            <button key={g} className={`db-group-tab${groupFilter === g ? ' active' : ''}`} onClick={() => setGroupFilter(g)}>
              {g === 'all' ? '全体' : GROUP_LABELS[g as AccountGroup]}
            </button>
          ))}
        </div>

        {/* Account section */}
        <div className="db-section">
          <div className="db-section-header">
            <span className="db-section-title">
              {groupFilter === 'all' ? '全アカウント' : GROUP_LABELS[groupFilter as AccountGroup]} 売上（期間内）
            </span>
            <span className="db-section-total">合計 ¥{visibleTotal.toLocaleString()}</span>
          </div>

          {groupFilter === 'all' ? (
            <div className="db-group-blocks">
              {(['omnibus','personal'] as AccountGroup[]).map(group => {
                const grpAccounts = [...accounts].filter(a => a.group === group)
                  .sort((a, b) => (salesByAccount[b.id]||0) - (salesByAccount[a.id]||0));
                if (grpAccounts.length === 0) return null;
                const gTotal = grpAccounts.reduce((s,a) => s + (salesByAccount[a.id]||0), 0);
                return (
                  <div key={group} className="db-group-block">
                    <div className="db-group-block-hdr">
                      <span className="db-group-block-name">{GROUP_LABELS[group]}</span>
                      <span className="db-group-block-total">¥{gTotal.toLocaleString()}</span>
                    </div>
                    <AccountGrid
                      accounts={grpAccounts}
                      salesByAccount={salesByAccount}
                      grandTotal={grandTotal}
                      onEdit={a => { setEditingAcc(a); setShowAccModal(true); }}
                      onAddSale={openAddSale}
                    />
                  </div>
                );
              })}
              {accounts.length === 0 && (
                <EmptyState onAdd={() => { setEditingAcc(null); setShowAccModal(true); }} />
              )}
            </div>
          ) : (
            visibleAccounts.length === 0 ? (
              <EmptyState onAdd={() => { setEditingAcc(null); setShowAccModal(true); }} />
            ) : (
              <AccountGrid
                accounts={[...visibleAccounts].sort((a,b) => (salesByAccount[b.id]||0) - (salesByAccount[a.id]||0))}
                salesByAccount={salesByAccount}
                grandTotal={grandTotal}
                onEdit={a => { setEditingAcc(a); setShowAccModal(true); }}
                onAddSale={openAddSale}
              />
            )
          )}
        </div>
      </div>

      {showAccModal && (
        <AccountModal
          account={editingAcc}
          onSave={a => { editingAcc ? onUpdateAccount(a) : onAddAccount(a); setShowAccModal(false); }}
          onDelete={editingAcc ? () => { onDeleteAccount(editingAcc.id); setShowAccModal(false); } : undefined}
          onClose={() => setShowAccModal(false)}
        />
      )}

      {showSaleModal && (
        <SaleModal
          sale={editingSale}
          accountId={saleAccountId}
          accounts={accounts}
          onSave={s => { editingSale ? onUpdateSale(s) : onAddSale(s); setShowSaleModal(false); }}
          onDelete={editingSale ? () => { onDeleteSale(editingSale.id); setShowSaleModal(false); } : undefined}
          onClose={() => setShowSaleModal(false)}
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
  onAddSale: (accountId: string) => void;
}
const AccountGrid: React.FC<GridProps> = ({ accounts, salesByAccount, grandTotal, onEdit, onAddSale }) => (
  <div className="db-acc-grid">
    {accounts.map((acc, i) => {
      const fee = salesByAccount[acc.id] || 0;
      const pct = grandTotal > 0 ? (fee / grandTotal) * 100 : 0;
      const color = acc.color || COLORS[i % COLORS.length];
      return (
        <div className="db-acc-card" key={acc.id}>
          <div className="db-acc-card-hdr">
            <div className="db-acc-name-row">
              <span className="db-acc-dot" style={{ background: color }} />
              <span className="db-acc-name">{acc.name}</span>
            </div>
            <button className="db-acc-edit-btn" onClick={() => onEdit(acc)}>編集</button>
          </div>
          <div className="db-acc-amount">¥{fee.toLocaleString()}</div>
          <div className="db-acc-bar-track">
            <div className="db-acc-bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
          <div className="db-acc-bottom">
            <span className="db-acc-pct">全体の {pct.toFixed(1)}%</span>
            <button className="db-acc-add-sale" onClick={() => onAddSale(acc.id)}>＋ 売上追加</button>
          </div>
        </div>
      );
    })}
  </div>
);

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="db-empty">
    <p>アカウントがありません</p>
    <button className="db-empty-btn" onClick={onAdd}>アカウントを追加</button>
  </div>
);

/* ---- AccountModal ---- */
interface AccModalProps {
  account: Account | null;
  onSave: (a: Account) => void;
  onDelete?: () => void;
  onClose: () => void;
}
const AccountModal: React.FC<AccModalProps> = ({ account, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(account?.name || '');
  const [group, setGroup] = useState<AccountGroup>(account?.group || 'omnibus');
  const [color, setColor] = useState(account?.color || COLORS[0]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <h3>{account ? 'アカウントを編集' : 'アカウントを追加'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>アカウント名 *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="例: SUTORE" />
          </div>
          <div className="form-group">
            <label>グループ</label>
            <div className="radio-group">
              {(['omnibus','personal'] as AccountGroup[]).map(g => (
                <label key={g} className={`radio-label${group === g ? ' selected' : ''}`}>
                  <input type="radio" checked={group === g} onChange={() => setGroup(g)} />
                  {GROUP_LABELS[g]}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>カラー</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <div key={c} className={`color-dot${color === c ? ' selected' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {onDelete && <button className="btn-delete" onClick={() => { if(window.confirm('削除しますか？')) onDelete!(); }}>削除</button>}
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>キャンセル</button>
            <button className="btn-save" onClick={() => { if(!name.trim()) return; onSave({ id: account?.id || uuidv4(), name: name.trim(), group, color }); }}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---- SaleModal ---- */
interface SaleModalProps {
  sale: SaleRecord | null;
  accountId: string;
  accounts: Account[];
  onSave: (s: SaleRecord) => void;
  onDelete?: () => void;
  onClose: () => void;
}
const SaleModal: React.FC<SaleModalProps> = ({ sale, accountId, accounts, onSave, onDelete, onClose }) => {
  const [accId, setAccId] = useState(sale?.accountId || accountId);
  const [amount, setAmount] = useState(sale?.amount || 0);
  const [date, setDate] = useState(sale?.date || new Date().toISOString().slice(0,10));
  const [memo, setMemo] = useState(sale?.memo || '');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <h3>{sale ? '売上を編集' : '売上を追加'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>アカウント</label>
            <select value={accId} onChange={e => setAccId(e.target.value)}>
              {(['omnibus','personal'] as AccountGroup[]).map(g => {
                const grp = accounts.filter(a => a.group === g);
                if (!grp.length) return null;
                return <optgroup key={g} label={GROUP_LABELS[g]}>{grp.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>;
              })}
            </select>
          </div>
          <div className="form-group">
            <label>売上金額（円）*</label>
            <input type="number" min={0} value={amount} onChange={e => setAmount(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>日付</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>メモ</label>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={3} placeholder="備考など" />
          </div>
        </div>
        <div className="modal-footer">
          {onDelete && <button className="btn-delete" onClick={() => { if(window.confirm('削除しますか？')) onDelete!(); }}>削除</button>}
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>キャンセル</button>
            <button className="btn-save" onClick={() => {
              if (!accId) return;
              onSave({ id: sale?.id || uuidv4(), accountId: accId, amount, date, memo });
            }}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
};
