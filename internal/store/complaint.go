package store

import (
	"fmt"
	"sort"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateComplaint(req models.CreateComplaintRequest) *models.Complaint {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("CP%06d", s.complaintSeq)
	s.complaintSeq++

	var bookingNo string
	booking, ok := s.bookings[req.BookingID]
	if ok {
		bookingNo = booking.BookingNo
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
	s.createNotificationLocked(
		"新投诉待处理",
		"投诉编号 "+complaint.ComplaintNo+"："+complaint.ComplaintType,
		models.RoleCustomerService,
		"",
		"complaint",
		complaint.ID,
	)

	return &complaint
}

func (s *Store) GetComplaint(id string) (*models.Complaint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	complaint, ok := s.complaints[id]
	if ok != true {
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
	if ok != true {
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

	if (complaint.Status == models.ComplaintHandling || complaint.Status == models.ComplaintResolved) && complaint.HandledAt == nil {
		complaint.HandledAt = &now
	}
	if complaint.Status == models.ComplaintResolved && complaint.ResolvedAt == nil {
		complaint.ResolvedAt = &now
	}

	s.complaints[id] = complaint
	s.createNotificationLocked(
		"投诉已处理",
		"投诉编号 "+complaint.ComplaintNo+"："+string(complaint.Status),
		models.RoleCustomerService,
		"",
		"complaint",
		complaint.ID,
	)

	return &complaint, true
}

func (s *Store) GetComplaintDetail(id string) (*models.ComplaintDetail, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	complaint, ok := s.complaints[id]
	if ok != true {
		return nil, false
	}

	detail := &models.ComplaintDetail{
		Complaint:     complaint,
		Booking:       nil,
		Schedule:      nil,
		ChangeLogs:    []models.BookingChangeLog{},
		Checkins:      []models.CheckinRecord{},
		Notifications: []models.Notification{},
	}

	bookingID := complaint.BookingID

	if bookingID != "" {
		if booking, ok := s.bookings[bookingID]; ok {
			b := booking
			detail.Booking = &b
			if logs, ok := s.changeLogs[bookingID]; ok { detail.ChangeLogs = logs }

			checkins := make([]models.CheckinRecord, 0)
			for _, ci := range s.checkins {
				if ci.BookingID == bookingID {
					checkins = append(checkins, ci)
				}
			}
			sort.Slice(checkins, func(i, j int) bool {
				return checkins[i].CheckinTime.Before(checkins[j].CheckinTime)
			})
			detail.Checkins = checkins
		}
	}

	if complaint.ScheduleID != "" {
		schedule, ok := s.schedules[complaint.ScheduleID]
		if ok {
			sc := schedule
			detail.Schedule = &sc
		}
	}

	notifications := make([]models.Notification, 0)
	for _, n := range s.notifications {
		if n.RelatedType == "complaint" && n.RelatedID == id {
			notifications = append(notifications, n)
		}
	}
	detail.Notifications = notifications

	return detail, true
}
