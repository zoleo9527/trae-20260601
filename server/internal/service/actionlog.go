package service

import (
	"central-kitchen/internal/database"
	"central-kitchen/internal/models"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func LogAction(db *gorm.DB, resourceID uuid.UUID, resourceType string, actionType models.ActionType, actionName string, description string, oldStatus string, newStatus string, performedBy uuid.UUID, metadata interface{}) error {
	metadataJSON, _ := json.Marshal(metadata)

	log := models.ActionLog{
		ResourceID:   resourceID,
		ResourceType: resourceType,
		ActionType:   actionType,
		ActionName:   actionName,
		Description:  description,
		OldStatus:    oldStatus,
		NewStatus:    newStatus,
		PerformedBy:  performedBy,
		Metadata:     string(metadataJSON),
		CreatedAt:    time.Now(),
	}

	return db.Create(&log).Error
}

func GetActionLogs(resourceID uuid.UUID, resourceType string) ([]models.ActionLog, error) {
	var logs []models.ActionLog
	err := database.DB.Where("resource_id = ? AND resource_type = ?", resourceID, resourceType).
		Preload("PerformedByUser").
		Order("created_at desc").
		Find(&logs).Error
	return logs, err
}
