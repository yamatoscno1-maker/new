import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { EventModal } from './components/EventModal';
import { EventList } from './components/EventList';
import { Dashboard } from './components/Dashboard';
import { LockScreen } from './components/LockScreen';
import { ShootingEvent } from './types';
import './App.css';

type View = 'calendar' | 'list' | 'dashboard';

const STORAGE_KEY = 'shooting-events';
const PASSWORD_KEY = 'app-password';

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(() => !!localStorage.getItem(PASSWORD_KEY));

  const [events, setEvents] = useState<ShootingEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<View>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<ShootingEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const handleSetPassword = (password: string) => {
    localStorage.setItem(PASSWORD_KEY, password);
    setHasPassword(true);
  };

  const handleChangePassword = () => {
    if (window.confirm('パスワードを変更しますか？')) {
      localStorage.removeItem(PASSWORD_KEY);
      setHasPassword(false);
      setUnlocked(false);
    }
  };

  if (!hasPassword) {
    return <LockScreen isSetup onUnlock={() => setUnlocked(true)} onSetPassword={handleSetPassword} />;
  }

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  const handleAddEvent = (event: ShootingEvent) => {
    setEvents(prev => [...prev, event]);
    setModalOpen(false);
  };

  const handleUpdateEvent = (event: ShootingEvent) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setModalOpen(false);
    setEditingEvent(null);
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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="app-icon">📷</span>
          <h1>撮影管理カレンダー</h1>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
          >
            📅 カレンダー
          </button>
          <button
            className={`nav-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            📋 リスト
          </button>
          <button
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            📊 ダッシュボード
          </button>
        </nav>
        <div className="header-right">
          <button className="lock-btn-header" onClick={() => setUnlocked(false)} title="ロック">🔒</button>
          <button className="add-btn" onClick={() => { setEditingEvent(null); setSelectedDate(null); setModalOpen(true); }}>
            ＋ 撮影を追加
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === 'calendar' && (
          <Calendar
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'list' && (
          <EventList
            events={events}
            onEventClick={handleEventClick}
            onAdd={() => { setEditingEvent(null); setModalOpen(true); }}
          />
        )}
        {view === 'dashboard' && (
          <Dashboard events={events} onChangePassword={handleChangePassword} />
        )}
      </main>

      {modalOpen && (
        <EventModal
          initialDate={selectedDate}
          event={editingEvent}
          onSave={editingEvent ? handleUpdateEvent : handleAddEvent}
          onDelete={editingEvent ? () => handleDeleteEvent(editingEvent.id) : undefined}
          onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}

export default App;
