package database

import (
	"log"
	"os"
	"time"

	"central-kitchen/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() error {
	dbPath := "./data/central_kitchen.db"
	_ = os.MkdirAll("./data", 0755)

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	db, err := gorm.Open(sqlite.Open(dbPath+"?_busy_timeout=5000&_journal_mode=WAL"), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		return err
	}

	DB = db

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetConnMaxLifetime(time.Hour)

	err = DB.AutoMigrate(
		&models.User{},
		&models.PurchaseOrder{},
		&models.PurchaseItem{},
		&models.Requisition{},
		&models.RequisitionItem{},
		&models.AllergenReview{},
		&models.AllergenCheckItem{},
		&models.ActionLog{},
	)
	if err != nil {
		return err
	}

	if err := seedUsers(); err != nil {
		log.Printf("Warning: failed to seed users: %v", err)
	}

	if err := seedSampleData(); err != nil {
		log.Printf("Warning: failed to seed sample data: %v", err)
	}

	return nil
}

func seedUsers() error {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	users := []struct {
		username string
		password string
		name     string
		role     models.Role
	}{
		{"procurement1", "pass123", "张采购", models.RoleProcurementManager},
		{"production1", "pass123", "李班长", models.RoleProductionForeman},
		{"store1", "pass123", "王督导", models.RoleStoreSupervisor},
	}

	for _, u := range users {
		hashed, err := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		user := models.User{
			Username:     u.username,
			PasswordHash: string(hashed),
			Name:         u.name,
			Role:         u.role,
		}
		if err := DB.Create(&user).Error; err != nil {
			return err
		}
		log.Printf("Created user: %s (%s)", u.username, u.role)
	}

	return nil
}

func seedSampleData() error {
	var count int64
	DB.Model(&models.PurchaseOrder{}).Count(&count)
	if count > 0 {
		return nil
	}

	var user models.User
	if err := DB.Where("username = ?", "procurement1").First(&user).Error; err != nil {
		return err
	}

	expectedDate := time.Now().AddDate(0, 0, 3)
	po := models.PurchaseOrder{
		OrderNo:      "PO-2026-0001",
		SupplierName: "上海食材供应链有限公司",
		TotalAmount:  15680.50,
		Status:       models.PurchaseStatusReceived,
		ExpectedDate: expectedDate,
		ReceivedDate: &expectedDate,
		CreatedBy:    user.ID,
		Items: []models.PurchaseItem{
			{
				MaterialName: "小麦粉",
				SKU:          "MAT-001",
				Quantity:     500,
				Unit:         "kg",
				UnitPrice:    5.80,
				AllergenInfo: "含麸质",
				BatchNo:      "B20260601-01",
			},
			{
				MaterialName: "鸡蛋",
				SKU:          "MAT-002",
				Quantity:     200,
				Unit:         "kg",
				UnitPrice:    12.50,
				AllergenInfo: "含蛋类",
				BatchNo:      "B20260601-02",
			},
			{
				MaterialName: "白砂糖",
				SKU:          "MAT-003",
				Quantity:     300,
				Unit:         "kg",
				UnitPrice:    4.20,
				AllergenInfo: "无常见过敏原",
				BatchNo:      "B20260601-03",
			},
			{
				MaterialName: "黄油",
				SKU:          "MAT-004",
				Quantity:     150,
				Unit:         "kg",
				UnitPrice:    45.00,
				AllergenInfo: "含乳制品",
				BatchNo:      "B20260601-04",
			},
		},
	}

	if err := DB.Create(&po).Error; err != nil {
		return err
	}

	log.Printf("Created sample purchase order: %s", po.OrderNo)
	return nil
}
