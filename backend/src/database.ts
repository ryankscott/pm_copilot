import sqlite3 from 'sqlite3';

export const initDB = (filepath: string): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filepath, (err) => {
      if (err) {
        reject(err);
      } else {
        db.run(`CREATE TABLE IF NOT EXISTS prds (
          id TEXT PRIMARY KEY,
          title TEXT,
          content TEXT,
          createdAt DATETIME,
          updatedAt DATETIME
        )`, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(db);
          }
        });
      }
    });
  });
};
