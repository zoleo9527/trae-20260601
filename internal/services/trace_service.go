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
	Record database.SafetyRecord `json:"record"`
	Audits []AuditEntry          `json:"audits"`
}

type TraceResult struct {
	// 签到级别数据
	Checkin      *database.ActivityCheckin   `json:"checkin,omitempty"`
	Checkins     []database.ActivityCheckin  `json:"checkins,omitempty"`
	
	// 安全记录
	SafetyRecords []SafetyRecordWithAudit    `json:"safety_records"`
	
	// 异常说明
	Exceptions   []database.Exception       `json:"exceptions"`
	
	// 统一审计日志
	Audits       []AuditEntry               `json:"audits"`
	
	// 统计信息
	Statistics   *CourseStatistics          `json:"statistics,omitempty"`
	
	// 课程信息
	Course       *database.Course           `json:"course,omitempty"`
}

type CourseStatistics struct {
	TotalCheckins int `json:"total_checkins"`
	RejectedCount int `json:"rejected_count"`
	BackfillCount int `json:"backfill_count"`
}

func (s *TraceService) GetFullTrace(checkinID string) (*TraceResult, error) {
	var checkin database.ActivityCheckin
	if err := s.db.Where("id = ?", checkinID).First(&checkin).Error; err != nil {
		return nil, err
	}

	safetyRecords := s.getSafetyRecordsWithAudits(checkinID)

	exceptions := s.getExceptions(checkinID)

	allAudits := s.getAllAuditsForCheckin(checkinID)

	return &TraceResult{
		Checkin:       &checkin,
		SafetyRecords: safetyRecords,
		Exceptions:    exceptions,
		Audits:        allAudits,
	}, nil
}

func (s *TraceService) GetCourseTrace(courseID string, startTime, endTime time.Time) (*TraceResult, error) {
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
	var allAudits []AuditEntry

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

		allAudits = s.getAllAuditsForCourse(courseID, checkinIDs)
	}

	return &TraceResult{
		Course:        &course,
		Checkins:      checkins,
		SafetyRecords: safetyRecords,
		Exceptions:    exceptions,
		Audits:        allAudits,
		Statistics: &CourseStatistics{
			TotalCheckins: totalCheckins,
			RejectedCount: rejectedCount,
			BackfillCount: backfillCount,
		},
	}, nil
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

func (s *TraceService) getAllAuditsForCheckin(checkinID string) []AuditEntry {
	var audits []database.AuditLog
	s.db.Where("data LIKE ?", "%\""+checkinID+"\"").
		Order("created_at ASC").
		Find(&audits)
	return convertAudits(audits)
}

func (s *TraceService) getAllAuditsForCourse(courseID string, checkinIDs []string) []AuditEntry {
	var audits []database.AuditLog
	s.db.Where("data LIKE ?", "%\""+courseID+"\"").
		Order("created_at DESC").
		Limit(100).
		Find(&audits)

	for _, checkinID := range checkinIDs {
		var checkinAudits []database.AuditLog
		s.db.Where("data LIKE ?", "%\""+checkinID+"\"").
			Where("module IN (?)", []string{"checkin", "safety", "exception"}).
			Order("created_at DESC").
			Limit(20).
			Find(&checkinAudits)
		audits = append(audits, checkinAudits...)
	}

	return convertAudits(audits)
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
