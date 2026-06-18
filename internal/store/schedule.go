package store

import (
	"fmt"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateSchedule(req models.CreateScheduleRequest) *models.GuideSchedule {
	s.mu.Lock()
	defer s.mu.Unlock()
	id := fmt.Sprintf("SC%06d", s.scheduleSeq)
	s.scheduleSeq++
	var bookingNo string
	var teamName string
	var visitorCount int
	booking, ok := s.bookings[req.BookingID]
	if ok {
		bookingNo = booking.BookingNo
		teamName = booking.TeamName
		visitorCount = booking.VisitorCount
	}
	now := time.Now()
	schedule := models.GuideSchedule{
		ID:            id,
		ScheduleNo:    id,
		BookingID:     req.BookingID,
		BookingNo:     bookingNo,
		GuideID:       req.GuideID,
		GuideName:     req.GuideName,
		GuideLanguage: req.GuideLanguage,
		VisitDate:     req.VisitDate,
		StartTime:     req.StartTime,
		EndTime:       req.EndTime,
		TeamName:      teamName,
		VisitorCount:  visitorCount,
		Status:        models.ScheduleScheduled,
		Remark:        req.Remark,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	s.schedules[id] = schedule
	return &schedule
}

func (s *Store) GetSchedule(id string) (*models.GuideSchedule, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	schedule, ok := s.schedules[id]
	if !ok {
		return nil, false
	}
	return &schedule, true
}

func (s *Store) ListSchedules() []models.GuideSchedule {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]models.GuideSchedule, 0, len(s.schedules))
	for _, schedule := range s.schedules {
		result = append(result, schedule)
	}
	return result
}

func (s *Store) GetScheduleDetail(id string) (*models.ScheduleDetail, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	schedule, ok := s.schedules[id]
	if !ok {
		return nil, false
	}
	booking, ok := s.bookings[schedule.BookingID]
	if !ok {
		return nil, false
	}
	changeLogs := make([]models.BookingChangeLog, len(s.changeLogs[schedule.BookingID]))
	copy(changeLogs, s.changeLogs[schedule.BookingID])
	checkins := make([]models.CheckinRecord, 0)
	for _, ci := range s.checkins {
		if ci.BookingID == schedule.BookingID {
			checkins = append(checkins, ci)
		}
	}
	detail := &models.ScheduleDetail{
		Schedule:   schedule,
		Booking:    booking,
		ChangeLogs: changeLogs,
		Checkins:   checkins,
	}
	return detail, true
}

func (s *Store) UpdateSchedule(id string, req models.UpdateScheduleRequest) (*models.GuideSchedule, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	schedule, ok := s.schedules[id]
	if !ok {
		return nil, false
	}
	if req.GuideID != nil {
		schedule.GuideID = *req.GuideID
	}
	if req.GuideName != nil {
		schedule.GuideName = *req.GuideName
	}
	if req.StartTime != nil {
		schedule.StartTime = *req.StartTime
	}
	if req.EndTime != nil {
		schedule.EndTime = *req.EndTime
	}
	if req.Status != nil {
		schedule.Status = models.GuideScheduleStatus(*req.Status)
	}
	if req.Remark != nil {
		schedule.Remark = *req.Remark
	}
	schedule.UpdatedAt = time.Now()
	s.schedules[id] = schedule
	return &schedule, true
}

func (s *Store) ListSchedulesByBooking(bookingID string) []models.GuideSchedule {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []models.GuideSchedule
	for _, schedule := range s.schedules {
		if schedule.BookingID == bookingID {
			result = append(result, schedule)
		}
	}
	return result
}

func (s *Store) AdjustSchedulesForBooking(bookingID string, reason string) []models.GuideSchedule {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.adjustSchedulesForBookingLocked(bookingID, reason)
}

func (s *Store) adjustSchedulesForBookingLocked(bookingID string, reason string) []models.GuideSchedule {
	var result []models.GuideSchedule
	booking, ok := s.bookings[bookingID]
	if !ok {
		return result
	}
	for id, schedule := range s.schedules {
		if schedule.BookingID == bookingID {
			schedule.Status = models.ScheduleAdjusted
			schedule.VisitorCount = booking.VisitorCount
			schedule.VisitDate = booking.VisitDate
			schedule.GuideLanguage = booking.GuideLanguage
			schedule.UpdatedAt = time.Now()
			s.schedules[id] = schedule
			result = append(result, schedule)
		}
	}
	return result
}
