import { useState, useEffect } from 'react';
import { db } from '../database/db';

export interface Settings {
  id: number;
  fuel_type: 'nafta' | 'gnc' | 'diesel' | 'nafta_gnc';
  fuel_price: number;
  gnc_price: number;
  gnc_ratio: number;
  consumption_100km: number;
  monthly_km: number;
  insurance: number;
  tax: number;
}

export interface ExtraExpense {
  id: number;
  name: string;
  amount: number;
  periodicity: 'monthly' | 'yearly';
}

export interface Cotizacion {
  id: number;
  nombre: string;
  fecha: string;
  total_monthly: number;
  settings_json: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [expenses, setExpenses] = useState<ExtraExpense[]>([]);

  useEffect(() => {
    const s = db.getFirstSync<Settings>('SELECT * FROM settings LIMIT 1');
    setSettings(s);
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const e = db.getAllSync<ExtraExpense>('SELECT * FROM extra_expenses');
    setExpenses(e);
  };

  const updateSetting = (key: keyof Omit<Settings, 'id'>, value: any) => {
    db.runSync(`UPDATE settings SET ${key} = ? WHERE id = ?`, [value, settings?.id]);
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const addExpense = (name: string, amount: number, periodicity: 'monthly' | 'yearly') => {
    db.runSync('INSERT INTO extra_expenses (name, amount, periodicity) VALUES (?, ?, ?)', [name, amount, periodicity]);
    loadExpenses();
  };

  const deleteExpense = (id: number) => {
    db.runSync('DELETE FROM extra_expenses WHERE id = ?', [id]);
    loadExpenses();
  };

  const saveCotizacion = (nombre: string, total: number, settingsData: Settings) => {
    const fecha = new Date().toLocaleString();
    db.runSync(
      'INSERT INTO cotizaciones (nombre, fecha, total_monthly, settings_json) VALUES (?, ?, ?, ?)',
      [nombre, fecha, total, JSON.stringify(settingsData)]
    );
  };

  const loadCotizacion = (settingsData: Settings) => {
    db.runSync(`UPDATE settings SET fuel_type = ?, fuel_price = ?, gnc_price = ?, gnc_ratio = ?, consumption_100km = ?, monthly_km = ?, insurance = ?, tax = ? WHERE id = ?`, 
      [settingsData.fuel_type, settingsData.fuel_price, settingsData.gnc_price, settingsData.gnc_ratio, settingsData.consumption_100km, settingsData.monthly_km, settingsData.insurance, settingsData.tax, settings?.id]);
    setSettings(settingsData);
  };

  const deleteCotizacion = (id: number) => {
    db.runSync('DELETE FROM cotizaciones WHERE id = ?', [id]);
  };

  return { settings, expenses, updateSetting, addExpense, deleteExpense, saveCotizacion, getCotizaciones, loadCotizacion, deleteCotizacion };
};
