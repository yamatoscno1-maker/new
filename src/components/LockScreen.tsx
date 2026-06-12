import React, { useState } from 'react';
import './LockScreen.css';

interface Props {
  onUnlock: () => void;
  onSetPassword?: (password: string) => void;
  isSetup?: boolean;
}

export const LockScreen: React.FC<Props> = ({ onUnlock, onSetPassword, isSetup = false }) => {
  const [input, setInput] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>(isSetup ? 'enter' : 'enter');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSetup) {
      if (step === 'enter') {
        if (input.length < 4) { setError('4文字以上で設定してください'); return; }
        setStep('confirm');
        setError('');
      } else {
        if (input !== confirm) { setError('パスワードが一致しません'); setConfirm(''); return; }
        onSetPassword?.(input);
        onUnlock();
      }
    } else {
      const saved = localStorage.getItem('app-password');
      if (input === saved) {
        onUnlock();
      } else {
        setError('パスワードが違います');
        setInput('');
      }
    }
  };

  return (
    <div className="lockscreen">
      <div className="lock-card">
        <div className="lock-icon">🔒</div>
        <h1>撮影管理カレンダー</h1>
        <p className="lock-sub">
          {isSetup
            ? step === 'enter' ? 'パスワードを設定してください' : 'もう一度入力してください'
            : 'パスワードを入力してください'}
        </p>

        <form onSubmit={handleSubmit} className="lock-form">
          {isSetup && step === 'confirm' ? (
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="パスワードを再入力"
              autoFocus
              className={error ? 'shake' : ''}
            />
          ) : (
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isSetup ? 'パスワードを入力（4文字以上）' : 'パスワード'}
              autoFocus
              className={error ? 'shake' : ''}
            />
          )}
          {error && <div className="lock-error">{error}</div>}
          <button type="submit" className="lock-btn">
            {isSetup ? (step === 'enter' ? '次へ' : '設定する') : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
};
