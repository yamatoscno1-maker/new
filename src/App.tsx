import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { Calendar } from './components/Calendar';
import { EventModal } from './components/EventModal';
import { EventList } from './components/EventList';
import { Dashboard } from './components/Dashboard';
import { SalesDashboard } from './components/SalesDashboard';
import { ShootingEvent, Account } from './types';
import './App.css';

type View = 'calendar' | 'list' | 'dashboard' | 'sales';

function App() {
  const [events, setEvents] = useState<ShootingEvent[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [view, setView] = useState<View>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<ShootingEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('app-password');
  }, []);

  useEffect(() => {
    let eventsLoaded = false;
    let accountsLoaded = false;
    const checkDone = () => { if (eventsLoaded && accountsLoaded) setLoading(false); };

    const unsubEvents = onSnapshot(collection(db, 'events'), snapshot => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ShootingEvent));
      setEvents(data);
      eventsLoaded = true;
      checkDone();
    });

    const unsubAccounts = onSnapshot(collection(db, 'accounts'), snapshot => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Account));
      setAccounts(data);
      accountsLoaded = true;
      checkDone();
    });

    return () => { unsubEvents(); unsubAccounts(); };
  }, []);

  const handleAddEvent = async (event: ShootingEvent) => {
    const { id, ...data } = event;
    await addDoc(collection(db, 'events'), data);
    setModalOpen(false);
  };

  const handleUpdateEvent = async (event: ShootingEvent) => {
    const { id, ...data } = event;
    await updateDoc(doc(db, 'events', id), data);
    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'events', id));
    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleAddAccount = async (account: Account) => {
    const { id, ...data } = account;
    await addDoc(collection(db, 'accounts'), data);
  };

  const handleUpdateAccount = async (account: Account) => {
    const { id, ...data } = account;
    await updateDoc(doc(db, 'accounts', id), data);
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteDoc(doc(db, 'accounts', id));
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (event: ShootingEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon">📷</div>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="app-icon">📷</span>
          <h1>撮影管理カレンダー</h1>
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
            📅 カレンダー
          </button>
          <button className={`nav-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            📋 リスト
          </button>
          <button className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            📊 ダッシュボード
          </button>
          <button className={`nav-btn ${view === 'sales' ? 'active' : ''}`} onClick={() => setView('sales')}>
            💰 売上管理
          </button>
        </nav>
        <div className="header-right">
          <button className="add-btn" onClick={() => { setEditingEvent(null); setSelectedDate(null); setModalOpen(true); }}>
            ＋ 撮影を追加
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === 'calendar' && (
          <Calendar events={events} onDateClick={handleDateClick} onEventClick={handleEventClick} />
        )}
        {view === 'list' && (
          <EventList events={events} onEventClick={handleEventClick} onAdd={() => { setEditingEvent(null); setModalOpen(true); }} />
        )}
        {view === 'dashboard' && (
          <Dashboard events={events} />
        )}
        {view === 'sales' && (
          <SalesDashboard
            events={events}
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>

      {modalOpen && (
        <EventModal
          initialDate={selectedDate}
          event={editingEvent}
          accounts={accounts}
          onSave={editingEvent ? handleUpdateEvent : handleAddEvent}
          onDelete={editingEvent ? () => handleDeleteEvent(editingEvent.id) : undefined}
          onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}

export default App;
