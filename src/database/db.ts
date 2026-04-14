import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('costoauto.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fuel_type TEXT DEFAULT 'nafta',
      fuel_price REAL,
      gnc_price REAL DEFAULT 0,
      gnc_ratio REAL DEFAULT 50,
      consumption_100km REAL,
      monthly_km INTEGER,
      insurance REAL,
      tax REAL
    );
  `);

  // Migration for missing columns
  const tableInfo = db.getAllSync<{ name: string }>('PRAGMA table_info(settings)');
  const columns = tableInfo.map(c => c.name);
  
  if (!columns.includes('fuel_type')) db.execSync("ALTER TABLE settings ADD COLUMN fuel_type TEXT DEFAULT 'nafta'");
  if (!columns.includes('gnc_price')) db.execSync("ALTER TABLE settings ADD COLUMN gnc_price REAL DEFAULT 0");
  if (!columns.includes('gnc_ratio')) db.execSync("ALTER TABLE settings ADD COLUMN gnc_ratio REAL DEFAULT 50");

  db.execSync(`
    CREATE TABLE IF NOT EXISTS extra_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      amount REAL,
      periodicity TEXT DEFAULT 'monthly'
    );
    CREATE TABLE IF NOT EXISTS cotizaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      fecha TEXT,
      total_monthly REAL,
      settings_json TEXT
    );
  `);

  // Migration for missing column in extra_expenses
  const expensesTableInfo = db.getAllSync<{ name: string }>('PRAGMA table_info(extra_expenses)');
  const expensesColumns = expensesTableInfo.map(c => c.name);
  if (!expensesColumns.includes('periodicity')) {
    db.execSync("ALTER TABLE extra_expenses ADD COLUMN periodicity TEXT DEFAULT 'monthly'");
  }

  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM settings');
  if (count && count.count === 0) {
    db.runSync(
      'INSERT INTO settings (fuel_type, fuel_price, gnc_price, gnc_ratio, consumption_100km, monthly_km, insurance, tax) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['nafta', 1200, 500, 50, 8.5, 1000, 50000, 20000]
    );
  }
};
