package services

import (
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type IdempotentService struct {
	db *gorm.DB
}

func NewIdempotentService(db *gorm.DB) *IdempotentService {
	return &IdempotentService{db: db}
}

func (s *IdempotentService) CheckAndSet(key, data string, expireMinutes int) (bool, string) {
	var record database.IdempotentRecord
	err := s.db.Where("key = ? AND expire_at > ?", key, time.Now()).First(&record).Error

	if err == nil {
		return true, record.Data
	}

	if err != gorm.ErrRecordNotFound {
		return false, ""
	}

	newRecord := database.IdempotentRecord{
		ID:        database.GenerateID(),
		Key:       key,
		Data:      data,
		ExpireAt:  time.Now().Add(time.Duration(expireMinutes) * time.Minute),
		CreatedAt: time.Now(),
	}

	if err := s.db.Create(&newRecord).Error; err != nil {
		return false, ""
	}

	return false, ""
}

func (s *IdempotentService) Get(key string) (string, bool) {
	var record database.IdempotentRecord
	err := s.db.Where("key = ? AND expire_at > ?", key, time.Now()).First(&record).Error

	if err != nil {
		return "", false
	}

	return record.Data, true
}
