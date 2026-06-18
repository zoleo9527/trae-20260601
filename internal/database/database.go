package database

import (
	"os"
	"path/filepath"

	"github.com/jinzhu/gorm"
	_ "github.com/mattn/go-sqlite3"
)

func NewDB() (*gorm.DB, error) {
	dbPath := "./database/museum.db"
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	db, err := gorm.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func Migrate(db *gorm.DB) {
	db.AutoMigrate(
		&Course{},
		&Instructor{},
		&Material{},
		&ActivitySignup{},
		&ActivityCheckin{},
		&SafetyRecord{},
		&AuditLog{},
	)
}
