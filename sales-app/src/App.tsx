import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { Account, SaleRecord } from './types';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let a = false, s = false;
    const done = () => { if (a && s) setLoading(false); };
    const u1 = onSnapshot(collection(db, 'sa_accounts'), snap => {
      setAccounts(snap.docs.map(d => ({ ...d.data(), id: d.id } as Account)));
      a = true; done();
    });
    const u2 = onSnapshot(collection(db, 'sa_sales'), snap => {
      setSales(snap.docs.map(d => ({ ...d.data(), id: d.id } as SaleRecord)));
      s = true; done();
    });
    return () => { u1(); u2(); };
  }, []);

  const addAccount = async (acc: Account) => {
    const { id, ...data } = acc;
    await addDoc(collection(db, 'sa_accounts'), data);
  };
  const updateAccount = async (acc: Account) => {
    const { id, ...data } = acc;
    await updateDoc(doc(db, 'sa_accounts', id), data);
  };
  const deleteAccount = async (id: string) => {
    await deleteDoc(doc(db, 'sa_accounts', id));
  };

  const addSale = async (s: SaleRecord) => {
    const { id, ...data } = s;
    await addDoc(collection(db, 'sa_sales'), data);
  };
  const updateSale = async (s: SaleRecord) => {
    const { id, ...data } = s;
    await updateDoc(doc(db, 'sa_sales', id), data);
  };
  const deleteSale = async (id: string) => {
    await deleteDoc(doc(db, 'sa_sales', id));
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <Dashboard
      accounts={accounts}
      sales={sales}
      onAddAccount={addAccount}
      onUpdateAccount={updateAccount}
      onDeleteAccount={deleteAccount}
      onAddSale={addSale}
      onUpdateSale={updateSale}
      onDeleteSale={deleteSale}
    />
  );
}

export default App;
