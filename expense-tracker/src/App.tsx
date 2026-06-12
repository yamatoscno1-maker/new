import React, { useState, useEffect, useCallback } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { Expense, Business } from './types';
import { fetchExpenses } from './utils/gmailApi';
import { loadExpenses, saveExpenses, mergeExpenses, updateBusiness } from './utils/storage';
import './App.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

type Tab = 'list' | 'dashboard';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());
  const [tab, setTab] = useState<Tab>('list');
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(
    localStorage.getItem('expense-last-sync')
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  const handleSync = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const incoming = await fetchExpenses(token);
      setExpenses(prev => mergeExpenses(prev, incoming));
      const now = new Date().toLocaleString('ja-JP');
      setLastSync(now);
      localStorage.setItem('expense-last-sync', now);
    } catch (e: any) {
      if (e.message?.includes('401')) {
        setToken(null);
        setError('セッションが切れました。再ログインしてください。');
      } else {
        setError(`取込失敗: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleUpdateBusiness = (id: string, business: Business) => {
    setExpenses(prev => updateBusiness(prev, id, business));
  };

  if (!token) {
    return <Login clientId={CLIENT_ID} onToken={setToken} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span>💳</span>
          <h1>経費管理</h1>
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
            📋 明細
          </button>
          <button className={`nav-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            📊 ダッシュボード
          </button>
        </nav>
        <div className="header-right">
          {lastSync && <span className="last-sync">最終同期: {lastSync}</span>}
          <button className="sync-btn" onClick={handleSync} disabled={loading}>
            {loading ? '取込中...' : '🔄 メール取込'}
          </button>
          <button className="logout-btn" onClick={() => setToken(null)} title="ログアウト">
            🚪
          </button>
        </div>
      </header>

      {error && <div className="error-bar">{error}</div>}

      <main className="app-main">
        {tab === 'list' && (
          <ExpenseList expenses={expenses} onUpdateBusiness={handleUpdateBusiness} />
        )}
        {tab === 'dashboard' && <Dashboard expenses={expenses} />}
      </main>
    </div>
  );
}
