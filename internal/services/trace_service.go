package services

import (
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type TraceService struct {
	db *gorm.DB
}

func NewTraceService(db *gorm.DB) *TraceService {
	return &TraceService{db: db}
}

type AuditEntry struct {
	ID        string    `json:"id"`
	Action    string    `json:"action"`
	Module    string    `json:"module"`
	TargetID  string    `json:"target_id"`
	UserID    string    `json:"user_id"`
	UserName  string    `json:"user_name"`
	Data      string    `json:"data"`
	CreatedAt time.Time `json:"created_at"`
}

type SafetyRecordWithAudit struct {
	Record  database.SafetyRecord `json:"record"`
	Audits  []AuditEntry          `json:"audits"`
}

type CheckinTrace struct {
	Checkin        *database.ActivityCheckin   `json:"checkin"`
	CheckinAudits  []AuditEntry                `json:"checkin_audits"`
	SafetyRecords  []SafetyRecordWithAudit     `json:"safety_records"`
	Exceptions     []database.Exception        `json:"exceptions"`
	LinkedAudits   []AuditEntry                `json:"linked_audits"`
}

type CourseTrace struct {
	Course          *database.Course            `json:"course"`
	Checkins        []database.ActivityCheckin  `json:"checkins"`
	Statistics      CourseStatistics            `json:"statistics"`
	SafetyRecords   []SafetyRecordWithAudit     `json:"safety_records"`
	Exceptions     []database.Exception        `json:"exceptions"`
	Audits         []AuditEntry                `json:"audits"`
}

type CourseStatistics struct {
	TotalCheckins int `json:"total_checkins"`
	RejectedCount int `json:"rejected_count"`
	BackfillCount int `json:"backfill_count"`
}

func (s *TraceService) GetFullTrace(checkinID string) (*CheckinTrace, error) {
	var checkin database.ActivityCheckin
	if err := s.db.Where("id = ?", checkinID).First(&checkin).Error; err != nil {
		return nil, err
	}

	checkinAudits := s.getCheckinAudits(checkinID)

	safetyRecords := s.getSafetyRecordsWithAudits(checkinID)

	exceptions := s.getExceptions(checkinID)

	linkedAudits := s.getLinkedAudits(checkinID)

	return &CheckinTrace{
		Checkin:        &checkin,
		CheckinAudits:  checkinAudits,
		SafetyRecords:  safetyRecords,
		Exceptions:     exceptions,
		LinkedAudits:   linkedAudits,
	}, nil
}

func (s *TraceService) getCheckinAudits(checkinID string) []AuditEntry {
	var audits []database.AuditLog
	s.db.Where("(module = ? AND target_id = ?) OR (module = ? AND data LIKE ?)",
		"checkin", checkinID,
		"checkin", "%\""+checkinID+"\"").
		Order("created_at ASC").
		Find(&audits)

	return convertAudits(audits)
}

func (s *TraceService) getSafetyRecordsWithAudits(checkinID string) []SafetyRecordWithAudit {
	var records []database.SafetyRecord
	s.db.Where("checkin_id = ?", checkinID).Order("created_at ASC").Find(&records)

	var result []SafetyRecordWithAudit
	for _, record := range records {
		var audits []database.AuditLog
		s.db.Where("(module = ? AND target_id = ?) OR (module = ? AND data LIKE ?)",
			"safety", record.ID,
			"safety", "%\""+record.ID+"\"").
			Order("created_at ASC").
			Find(&audits)

		result = append(result, SafetyRecordWithAudit{
			Record: record,
			Audits: convertAudits(audits),
		})
	}
	return result
}

func (s *TraceService) getExceptions(checkinID string) []database.Exception {
	var exceptions []database.Exception
	s.db.Where("checkin_id = ?", checkinID).Order("created_at ASC").Find(&exceptions)
	return exceptions
}

func (s *TraceService) getLinkedAudits(checkinID string) []AuditEntry {
	var audits []database.AuditLog
	s.db.Where("data LIKE ?", "%\""+checkinID+"\"").
		Where("module NOT IN (?)", []string{"checkin", "safety"}).
		Order("created_at ASC").
		Find(&audits)

	return convertAudits(audits)
}

func (s *TraceService) GetCourseTrace(courseID string, startTime, endTime time.Time) (*CourseTrace, error) {
	var checkins []database.ActivityCheckin
	query := s.db.Where("course_id = ?", courseID)
	if !startTime.IsZero() {
		query = query.Where("checkin_time >= ?", startTime)
	}
	if !endTime.IsZero() {
		query = query.Where("checkin_time <= ?", endTime)
	}
	query.Order("checkin_time DESC").Find(&checkins)

	var course database.Course
	s.db.Where("id = ?", courseID).First(&course)

	var totalCheckins = len(checkins)
	var rejectedCount int
	var backfillCount int
	for _, c := range checkins {
		if c.Status == "rejected" {
			rejectedCount++
		} else if c.Status == "backfilled" {
			backfillCount++
		}
	}

	checkinIDs := make([]string, len(checkins))
	for i, c := range checkins {
		checkinIDs[i] = c.ID
	}

	var safetyRecords []SafetyRecordWithAudit
	var exceptions []database.Exception
	if len(checkinIDs) > 0 {
		var records []database.SafetyRecord
		s.db.Where("checkin_id IN (?)", checkinIDs).Find(&records)
		for _, record := range records {
			var audits []database.AuditLog
			s.db.Where("(module = ? AND target_id = ?) OR (module = ? AND data LIKE ?)",
				"safety", record.ID,
				"safety", "%\""+record.ID+"\"").
				Order("created_at ASC").
				Find(&audits)
			safetyRecords = append(safetyRecords, SafetyRecordWithAudit{
				Record: record,
				Audits: convertAudits(audits),
			})
		}

		s.db.Where("checkin_id IN (?)", checkinIDs).Find(&exceptions)
	}

	var audits []database.AuditLog
	s.db.Where("data LIKE ?", "%\""+courseID+"\"").
		Order("created_at DESC").
		Limit(100).
		Find(&audits)

	return &CourseTrace{
		Course:        &course,
		Checkins:      checkins,
		Statistics: CourseStatistics{
			TotalCheckins: totalCheckins,
			RejectedCount: rejectedCount,
			BackfillCount: backfillCount,
		},
		SafetyRecords: safetyRecords,
		Exceptions:    exceptions,
		Audits:        convertAudits(audits),
	}, nil
}

func convertAudits(audits []database.AuditLog) []AuditEntry {
	result := make([]AuditEntry, len(audits))
	for i, audit := range audits {
		result[i] = AuditEntry{
			ID:        audit.ID,
			Action:    audit.Action,
			Module:    audit.Module,
			TargetID:  audit.TargetID,
			UserID:    audit.UserID,
			UserName:  audit.UserName,
			Data:      audit.Data,
			CreatedAt: audit.CreatedAt,
		}
	}
	return result
}
