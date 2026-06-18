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

func (s *IdempotentService) Check(key string) (bool, string) {
	var record database.IdempotentRecord
	err := s.db.Where("key = ? AND expire_at > ?", key, time.Now()).First(&record).Error

	if err == nil {
		return true, record.Data
	}

	if err != gorm.ErrRecordNotFound {
		return false, ""
	}

	return false, ""
}

func (s *IdempotentService) Lock(key string, expireMinutes int) (bool, error) {
	isDuplicate, _ := s.Check(key)
	if isDuplicate {
		return true, nil
	}

	newRecord := database.IdempotentRecord{
		ID:        database.GenerateID(),
		Key:       key,
		Data:      "__LOCKED__",
		ExpireAt:  time.Now().Add(time.Duration(expireMinutes) * time.Minute),
		CreatedAt: time.Now(),
	}

	if err := s.db.Create(&newRecord).Error; err != nil {
		return false, err
	}

	return false, nil
}

func (s *IdempotentService) Commit(key, data string, expireMinutes int) error {
	var record database.IdempotentRecord
	err := s.db.Where("key = ?", key).First(&record).Error
	if err != nil {
		return err
	}

	record.Data = data
	record.ExpireAt = time.Now().Add(time.Duration(expireMinutes) * time.Minute)
	return s.db.Save(&record).Error
}

func (s *IdempotentService) Get(key string) (string, bool) {
	var record database.IdempotentRecord
	err := s.db.Where("key = ? AND expire_at > ?", key, time.Now()).First(&record).Error

	if err != nil {
		return "", false
	}

	return record.Data, true
}

func (s *IdempotentService) CheckAndGet(key string) (bool, string) {
	isDuplicate, data := s.Check(key)
	if isDuplicate && data != "__LOCKED__" {
		return true, data
	}
	return false, ""
}
