import sqlite3 from "sqlite3";

export const initDB = (filepath: string): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filepath, (err) => {
      if (err) {
        reject(err);
      } else {
        // Create PRDs table
        db.run(
          `CREATE TABLE IF NOT EXISTS prds (
          id TEXT PRIMARY KEY,
          title TEXT,
          content TEXT,
          createdAt DATETIME,
          updatedAt DATETIME
        )`,
          (err) => {
            if (err) {
              reject(err);
            } else {
              // Create interactive sessions table
              db.run(
                `CREATE TABLE IF NOT EXISTS interactive_sessions (
              id TEXT PRIMARY KEY,
              prd_id TEXT,
              conversation_history TEXT,
              settings TEXT,
              created_at DATETIME,
              updated_at DATETIME,
              FOREIGN KEY (prd_id) REFERENCES prds (id) ON DELETE CASCADE
            )`,
                (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(db);
                  }
                }
              );
            }
          }
        );
      }
    });
  });
};
