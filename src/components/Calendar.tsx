import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ShootingEvent } from '../types';
import { statusColor, categoryLabel } from '../utils';
import './Calendar.css';

interface Props {
  events: ShootingEvent[];
  onDateClick: (date: string) => void;
  onEventClick: (event: ShootingEvent) => void;
}

export const Calendar: React.FC<Props> = ({ events, onDateClick, onEventClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const getEventsForDate = (date: Date) =>
    events.filter(e => isSameDay(parseISO(e.date), date));

  const today = new Date();

  return (
    <div className="calendar">
      <div className="cal-header">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>‹</button>
        <h2>{format(currentMonth, 'yyyy年 M月', { locale: ja })}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>›</button>
        <button className="today-btn" onClick={() => setCurrentMonth(new Date())}>今日</button>
      </div>
      <div className="cal-grid">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
          <div key={d} className={`cal-dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{d}</div>
        ))}
        {weeks.flat().map((date, idx) => {
          const dayEvents = getEventsForDate(date);
          const inMonth = isSameMonth(date, currentMonth);
          const isToday = isSameDay(date, today);
          const dow = date.getDay();
          return (
            <div
              key={idx}
              className={`cal-cell ${!inMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}`}
              onClick={() => onDateClick(format(date, 'yyyy-MM-dd'))}
            >
              <span className="cal-date">{format(date, 'd')}</span>
              <div className="cal-events">
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className="cal-event-chip"
                    style={{ background: statusColor(ev.status) }}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    title={`${ev.title} (${ev.startTime})`}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="cal-more">+{dayEvents.length - 3}件</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="legend-item"><span className="dot" style={{background:'#48bb78'}}></span>予定</span>
        <span className="legend-item"><span className="dot" style={{background:'#3182ce'}}></span>確定</span>
        <span className="legend-item"><span className="dot" style={{background:'#718096'}}></span>完了</span>
        <span className="legend-item"><span className="dot" style={{background:'#fc8181'}}></span>キャンセル</span>
      </div>
    </div>
  );
};
