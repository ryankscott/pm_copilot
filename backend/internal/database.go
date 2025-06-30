package internal

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

func InitDB(filepath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", filepath)
	if err != nil {
		return nil, err
	}

	statement, err := db.Prepare("CREATE TABLE IF NOT EXISTS prds (id TEXT PRIMARY KEY, title TEXT, content TEXT, createdAt DATETIME, updatedAt DATETIME)")
	if err != nil {
		return nil, err
	}
	statement.Exec()

	return db, nil
}
