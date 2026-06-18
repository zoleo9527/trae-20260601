package store

import (
	"fmt"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateComplaint(req models.CreateComplaintRequest) *models.Complaint {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("CP%06d", s.complaintSeq)
	s.complaintSeq++

	var bookingNo string
	if req.BookingID != "" {
		booking, ok := s.bookings[req.BookingID]
		if ok {
			bookingNo = booking.BookingNo
		}
	}

	now := time.Now()
	complaint := models.Complaint{
		ID:            id,
		ComplaintNo:   id,
		BookingID:     req.BookingID,
		BookingNo:     bookingNo,
		ScheduleID:    req.ScheduleID,
		Complainant:   req.Complainant,
		ContactPhone:  req.ContactPhone,
		ComplaintType: req.ComplaintType,
		Content:       req.Content,
		Status:        models.ComplaintOpen,
		CreatedAt:     now,
	}

	s.complaints[id] = complaint
	return &complaint
}

func (s *Store) GetComplaint(id string) (*models.Complaint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	complaint, ok := s.complaints[id]
	if !ok {
		return nil, false
	}
	return &complaint, true
}

func (s *Store) ListComplaints() []models.Complaint {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.Complaint, 0, len(s.complaints))
	for _, complaint := range s.complaints {
		result = append(result, complaint)
	}
	return result
}

func (s *Store) HandleComplaint(id string, req models.HandleComplaintRequest) (*models.Complaint, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	complaint, ok := s.complaints[id]
	if !ok {
		return nil, false
	}
	now := time.Now()
	if req.Handler != "" {
		complaint.Handler = req.Handler
	}
	if req.HandleResult != "" {
		complaint.HandleResult = req.HandleResult
	}
	if req.Status != "" {
		complaint.Status = models.ComplaintStatus(req.Status)
	}
	if complaint.Status == models.ComplaintHandling && complaint.HandledAt == nil {
		complaint.HandledAt = &now
	}
	if complaint.Status == models.ComplaintResolved && complaint.ResolvedAt == nil {
		complaint.ResolvedAt = &now
	}
	s.complaints[id] = complaint
	return &complaint, true
}

func (s *Store) GetComplaintDetail(id string) (*models.ComplaintDetail, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	complaint, ok := s.complaints[id]
	if !ok {
		return nil, false
	}

	detail := &models.ComplaintDetail{
		Complaint:  complaint,
		Booking:    nil,
		Schedule:   nil,
		ChangeLogs: []models.BookingChangeLog{},
	}

	if complaint.BookingID != "" {
		booking, ok := s.bookings[complaint.BookingID]
		if ok {
			b := booking
			detail.Booking = &b
			logs := make([]models.BookingChangeLog, len(s.changeLogs[complaint.BookingID]))
			copy(logs, s.changeLogs[complaint.BookingID])
			detail.ChangeLogs = logs
		}
	}

	if complaint.ScheduleID != "" {
		schedule, ok := s.schedules[complaint.ScheduleID]
		if ok {
			sc := schedule
			detail.Schedule = &sc
		}
	}

	return detail, true
}
