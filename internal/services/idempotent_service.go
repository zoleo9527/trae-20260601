package services

import (
	"database/sql"
	"encoding/json"
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

type IdempotentResult struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Error   string      `json:"error,omitempty"`
}

func (s *IdempotentService) Check(key string) (bool, *IdempotentResult) {
	var record database.IdempotentRecord
	err := s.db.Where("key = ? AND expire_at > ?", key, time.Now()).First(&record).Error

	if err == nil {
		if record.Data == "__LOCKED__" {
			return true, nil
		}
		return true, parseResult(record.Data)
	}

	if err != gorm.ErrRecordNotFound {
		return false, nil
	}

	return false, nil
}

func (s *IdempotentService) Lock(key string, expireMinutes int) (bool, error) {
	isDuplicate, result := s.Check(key)
	if isDuplicate {
		if result != nil {
			return true, nil
		}
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
		if isUniqueConstraintError(err) {
			return true, nil
		}
		return false, err
	}

	return false, nil
}

func (s *IdempotentService) CommitSuccess(key string, data interface{}, expireMinutes int) error {
	result := IdempotentResult{
		Success: true,
		Data:    data,
	}
	dataStr, _ := json.Marshal(result)
	return s.commit(key, string(dataStr), expireMinutes)
}

func (s *IdempotentService) CommitError(key string, errMsg string, expireMinutes int) error {
	result := IdempotentResult{
		Success: false,
		Error:   errMsg,
	}
	dataStr, _ := json.Marshal(result)
	return s.commit(key, string(dataStr), expireMinutes)
}

func (s *IdempotentService) commit(key, data string, expireMinutes int) error {
	var record database.IdempotentRecord
	err := s.db.Where("key = ?", key).First(&record).Error
	if err != nil {
		return err
	}

	record.Data = data
	record.ExpireAt = time.Now().Add(time.Duration(expireMinutes) * time.Minute)
	return s.db.Save(&record).Error
}

func (s *IdempotentService) WaitForResult(key string, maxRetries int, retryInterval time.Duration) (bool, *IdempotentResult) {
	for i := 0; i < maxRetries; i++ {
		isDuplicate, result := s.Check(key)
		if isDuplicate && result != nil {
			return true, result
		}
		time.Sleep(retryInterval)
	}
	return false, nil
}

func (s *IdempotentService) Get(key string) (*IdempotentResult, bool) {
	isDuplicate, result := s.Check(key)
	if isDuplicate && result != nil {
		return result, true
	}
	return nil, false
}

func parseResult(data string) *IdempotentResult {
	var result IdempotentResult
	if err := json.Unmarshal([]byte(data), &result); err != nil {
		return nil
	}
	return &result
}

func isUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	if sqlErr, ok := err.(*sql.Error); ok {
		return sqlErr.Code == "23505" || sqlErr.Code == "SQLITE_CONSTRAINT"
	}
	return err.Error() == "UNIQUE constraint failed: idempotent_records.key" ||
		err.Error() == "duplicate key value violates unique constraint \"idempotent_records_key_idx\""
}
