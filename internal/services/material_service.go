package services

import (
	"encoding/json"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type MaterialService struct {
	db *gorm.DB
}

func NewMaterialService(db *gorm.DB) *MaterialService {
	return &MaterialService{db: db}
}

type CreateMaterialRequest struct {
	Name        string `json:"name" validate:"required"`
	Quantity    int    `json:"quantity"`
	Unit        string `json:"unit"`
	Description string `json:"description"`
	CourseID    string `json:"course_id"`
}

type UpdateMaterialRequest struct {
	Name        string `json:"name"`
	Quantity    int    `json:"quantity"`
	Unit        string `json:"unit"`
	Description string `json:"description"`
}

func (s *MaterialService) CreateMaterial(req CreateMaterialRequest) (*database.Material, error) {
	material := &database.Material{
		ID:          database.GenerateID(),
		Name:        req.Name,
		Quantity:    req.Quantity,
		Unit:        req.Unit,
		Description: req.Description,
		CourseID:    req.CourseID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(material).Error; err != nil {
		return nil, err
	}

	data, _ := json.Marshal(material)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "create",
		Module:    "material",
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return material, nil
}

func (s *MaterialService) GetMaterialByID(id string) (*database.Material, error) {
	var material database.Material
	if err := s.db.Where("id = ?", id).First(&material).Error; err != nil {
		return nil, err
	}
	return &material, nil
}

func (s *MaterialService) GetMaterialsByCourse(courseID string) ([]database.Material, error) {
	var materials []database.Material
	if err := s.db.Where("course_id = ?", courseID).Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (s *MaterialService) UpdateMaterial(id string, req UpdateMaterialRequest) (*database.Material, error) {
	var material database.Material
	if err := s.db.Where("id = ?", id).First(&material).Error; err != nil {
		return nil, err
	}

	oldData, _ := json.Marshal(material)

	if req.Name != "" {
		material.Name = req.Name
	}
	if req.Quantity > 0 {
		material.Quantity = req.Quantity
	}
	if req.Unit != "" {
		material.Unit = req.Unit
	}
	if req.Description != "" {
		material.Description = req.Description
	}
	material.UpdatedAt = time.Now()

	if err := s.db.Save(&material).Error; err != nil {
		return nil, err
	}

	newData, _ := json.Marshal(material)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "update",
		Module:    "material",
		Data:      "{\"old\":" + string(oldData) + ",\"new\":" + string(newData) + "}",
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return &material, nil
}

func (s *MaterialService) DeleteMaterial(id string) error {
	var material database.Material
	if err := s.db.Where("id = ?", id).First(&material).Error; err != nil {
		return err
	}

	data, _ := json.Marshal(material)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "delete",
		Module:    "material",
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return s.db.Delete(&material).Error
}

func (s *MaterialService) GetMaterialList(courseID string) (*MaterialListResponse, error) {
	var materials []database.Material
	if err := s.db.Where("course_id = ?", courseID).Find(&materials).Error; err != nil {
		return nil, err
	}

	return &MaterialListResponse{
		CourseID:  courseID,
		Materials: materials,
		Total:     len(materials),
	}, nil
}

type MaterialListResponse struct {
	CourseID  string                `json:"course_id"`
	Materials []database.Material   `json:"materials"`
	Total     int                   `json:"total"`
}
