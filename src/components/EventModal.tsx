import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShootingEvent, ShootingStatus, ShootingCategory } from '../types';
import { statusLabel, categoryLabel } from '../utils';
import './EventModal.css';

interface Props {
  event: ShootingEvent | null;
  initialDate: string | null;
  onSave: (event: ShootingEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const defaultForm = (): ShootingEvent => ({
  id: uuidv4(),
  title: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '10:00',
  endTime: '12:00',
  location: '',
  client: '',
  category: 'portrait',
  status: 'scheduled',
  notes: '',
  equipment: [],
  fee: 0,
});

export const EventModal: React.FC<Props> = ({ event, initialDate, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState<ShootingEvent>(() => {
    if (event) return { ...event };
    const d = defaultForm();
    if (initialDate) d.date = initialDate;
    return d;
  });
  const [equipInput, setEquipInput] = useState('');

  const set = (key: keyof ShootingEvent, val: any) =>
    setForm(f => ({ ...f, [key]: val }));

  const addEquip = () => {
    const v = equipInput.trim();
    if (v) {
      set('equipment', [...form.equipment, v]);
      setEquipInput('');
    }
  };

  const removeEquip = (i: number) =>
    set('equipment', form.equipment.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? '撮影を編集' : '撮影を追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group full">
              <label>タイトル *</label>
              <input
                required
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="例: 田中様 ポートレート撮影"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>日付</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>開始時間</label>
              <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label>終了時間</label>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>カテゴリ</label>
              <select value={form.category} onChange={e => set('category', e.target.value as ShootingCategory)}>
                {(['portrait','wedding','commercial','event','landscape','other'] as ShootingCategory[]).map(c => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>ステータス</label>
              <select value={form.status} onChange={e => set('status', e.target.value as ShootingStatus)}>
                {(['scheduled','confirmed','completed','cancelled'] as ShootingStatus[]).map(s => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full">
              <label>撮影場所</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="例: 新宿御苑" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>クライアント</label>
              <input value={form.client} onChange={e => set('client', e.target.value)} placeholder="例: 田中太郎" />
            </div>
            <div className="form-group">
              <label>料金 (円)</label>
              <input type="number" value={form.fee} onChange={e => set('fee', Number(e.target.value))} min={0} />
            </div>
          </div>

          <div className="form-group full">
            <label>機材</label>
            <div className="equip-input">
              <input
                value={equipInput}
                onChange={e => setEquipInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEquip(); } }}
                placeholder="機材を入力してEnter"
              />
              <button type="button" onClick={addEquip}>追加</button>
            </div>
            <div className="equip-tags">
              {form.equipment.map((eq, i) => (
                <span key={i} className="equip-tag">
                  {eq}
                  <button type="button" onClick={() => removeEquip(i)}>✕</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group full">
            <label>メモ</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="備考・メモ" />
          </div>

          <div className="modal-footer">
            {onDelete && (
              <button type="button" className="btn-delete" onClick={() => { if (window.confirm('削除しますか？')) onDelete(); }}>
                削除
              </button>
            )}
            <div className="footer-right">
              <button type="button" className="btn-cancel" onClick={onClose}>キャンセル</button>
              <button type="submit" className="btn-save">保存</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
