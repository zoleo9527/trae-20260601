package main

import (
	"microloan-api/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	db, err := gorm.Open(sqlite.Open("microloan.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	err = db.AutoMigrate(
		&models.Loan{},
		&models.RepaymentPlan{},
		&models.CollectionRecord{},
		&models.ExtensionApplication{},
		&models.ApprovalDecision{},
		&models.OperationLog{},
	)
	if err != nil {
		return err
	}

	DB = db
	return nil
}
