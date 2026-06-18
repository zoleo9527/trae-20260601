files = {}

files['internal/store/store.go'] = '''package store

import (
	"sync"

	"scenic-ticket-system/internal/models"
)

type Store struct {
	mu                  sync.RWMutex
	bookings            map[string]models.TeamBooking
	bookingSeq          int
	changeLogs          map[string][]models.BookingChangeLog
	changeLogSeq        int
	schedules           map[string]models.GuideSchedule
	scheduleSeq         int
	checkins            map[string]models.CheckinRecord
	checkinSeq          int
	complaints          map[string]models.Complaint
	complaintSeq        int
	notifications       map[string]models.Notification
	notificationSeq     int
}

func NewStore() *Store {
	return &Store{
		bookings:        make(map[string]models.TeamBooking),
		bookingSeq:      1,
		changeLogs:      make(map[string][]models.BookingChangeLog),
		changeLogSeq:    1,
		schedules:       make(map[string]models.GuideSchedule),
		scheduleSeq:     1,
		checkins:        make(map[string]models.CheckinRecord),
		checkinSeq:      1,
		complaints:      make(map[string]models.Complaint),
		complaintSeq:    1,
		notifications:   make(map[string]models.Notification),
		notificationSeq: 1,
	}
}
'''

files['internal/store/booking.go'] = '''package store

import (
	"fmt"
	"strconv"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateBooking(req models.CreateBookingRequest) *models.TeamBooking {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("BK%06d", s.bookingSeq)
	s.bookingSeq++

	now := time.Now()
	booking := models.TeamBooking{
		ID:            id,
		BookingNo:     id,
		TeamName:      req.TeamName,
		ContactName:   req.ContactName,
		ContactPhone:  req.ContactPhone,
		VisitorCount:  req.VisitorCount,
		VisitDate:     req.VisitDate,
		VisitTimeSlot: req.VisitTimeSlot,
		TicketType:    req.TicketType,
		GuideRequired: req.GuideRequired,
		GuideLanguage: req.GuideLanguage,
		Status:        models.BookingPending,
		Remark:        req.Remark,
		CreatedAt:     now,
		UpdatedAt:     now,
		CreatedBy:     req.Operator,
	}

	s.bookings[id] = booking
	return &booking
}

func (s *Store) GetBooking(id string) (*models.TeamBooking, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	booking, ok := s.bookings[id]
	if !ok {
		return nil, false
	}
	return &booking, true
}

func (s *Store) GetBookingByNo(bookingNo string) (*models.TeamBooking, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, booking := range s.bookings {
		if booking.BookingNo == bookingNo {
			b := booking
			return &b, true
		}
	}
	return nil, false
}

func (s *Store) ListBookings() []models.TeamBooking {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.TeamBooking, 0, len(s.bookings))
	for _, booking := range s.bookings {
		result = append(result, booking)
	}
	return result
}

func (s *Store) UpdateBooking(id string, req models.UpdateBookingRequest) (*models.TeamBooking, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	booking, ok := s.bookings[id]
	if !ok {
		return nil, false
	}

	oldBooking := booking

	if req.VisitorCount != nil {
		booking.VisitorCount = *req.VisitorCount
		s.addChangeLog(id, "update", "visitor_count", strconv.Itoa(oldBooking.VisitorCount), strconv.Itoa(*req.VisitorCount), req.ChangeReason, req.Operator)
	}
	if req.VisitDate != nil {
		booking.VisitDate = *req.VisitDate
		s.addChangeLog(id, "update", "visit_date", oldBooking.VisitDate, *req.VisitDate, req.ChangeReason, req.Operator)
	}
	if req.VisitTimeSlot != nil {
		booking.VisitTimeSlot = *req.VisitTimeSlot
		s.addChangeLog(id, "update", "visit_time_slot", oldBooking.VisitTimeSlot, *req.VisitTimeSlot, req.ChangeReason, req.Operator)
	}
	if req.TicketType != nil {
		booking.TicketType = *req.TicketType
		s.addChangeLog(id, "update", "ticket_type", oldBooking.TicketType, *req.TicketType, req.ChangeReason, req.Operator)
	}
	if req.GuideRequired != nil {
		booking.GuideRequired = *req.GuideRequired
		s.addChangeLog(id, "update", "guide_required", strconv.FormatBool(oldBooking.GuideRequired), strconv.FormatBool(*req.GuideRequired), req.ChangeReason, req.Operator)
	}
	if req.GuideLanguage != nil {
		booking.GuideLanguage = *req.GuideLanguage
		s.addChangeLog(id, "update", "guide_language", oldBooking.GuideLanguage, *req.GuideLanguage, req.ChangeReason, req.Operator)
	}
	if req.Status != nil {
		booking.Status = models.BookingStatus(*req.Status)
		s.addChangeLog(id, "status_change", "status", string(oldBooking.Status), *req.Status, req.ChangeReason, req.Operator)
	}
	if req.Remark != nil {
		booking.Remark = *req.Remark
	}

	booking.UpdatedAt = time.Now()
	s.bookings[id] = booking

	return &booking, true
}

func (s *Store) GetBookingChangeLogs(bookingID string) []models.BookingChangeLog {
	s.mu.RLock()
	defer s.mu.RUnlock()

	logs := s.changeLogs[bookingID]
	result := make([]models.BookingChangeLog, len(logs))
	copy(result, logs)
	return result
}

func (s *Store) GetBookingDetail(id string) (*models.BookingDetail, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	booking, ok := s.bookings[id]
	if !ok {
		return nil, false
	}

	schedules := make([]models.GuideSchedule, 0)
	for _, sch := range s.schedules {
		if sch.BookingID == id {
			schedules = append(schedules, sch)
		}
	}

	checkins := make([]models.CheckinRecord, 0)
	for _, ci := range s.checkins {
		if ci.BookingID == id {
			checkins = append(checkins, ci)
		}
	}

	complaints := make([]models.Complaint, 0)
	for _, cp := range s.complaints {
		if cp.BookingID == id {
			complaints = append(complaints, cp)
		}
	}

	changeLogs := make([]models.BookingChangeLog, len(s.changeLogs[id]))
	copy(changeLogs, s.changeLogs[id])

	detail := &models.BookingDetail{
		Booking:    booking,
		ChangeLogs: changeLogs,
		Schedules:  schedules,
		Checkins:   checkins,
		Complaints: complaints,
	}
	return detail, true
}

func (s *Store) addChangeLog(bookingID, changeType, fieldChanged, oldValue, newValue, reason, operator string) {
	id := fmt.Sprintf("LG%06d", s.changeLogSeq)
	s.changeLogSeq++

	log := models.BookingChangeLog{
		ID:            id,
		BookingID:     bookingID,
		ChangeType:    changeType,
		FieldChanged:  fieldChanged,
		OldValue:      oldValue,
		NewValue:      newValue,
		ChangeReason:  reason,
		ChangedBy:     operator,
		ChangedByRole: models.RoleTicketSupervisor,
		ChangedAt:     time.Now(),
	}

	s.changeLogs[bookingID] = append(s.changeLogs[bookingID], log)
}
'''

files['internal/store/schedule.go'] = '''package store

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
	booking, ok := s.bookings[req.BookingID]
	if ok {
		bookingNo = booking.BookingNo
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
		TeamName:      booking.TeamName,
		VisitorCount:  booking.VisitorCount,
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

	var result []models.GuideSchedule
	for id, schedule := range s.schedules {
		if schedule.BookingID == bookingID {
			schedule.Status = models.ScheduleAdjusted
			schedule.UpdatedAt = time.Now()
			s.schedules[id] = schedule
			result = append(result, schedule)
		}
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
'''

files['internal/store/checkin.go'] = '''package store

import (
	"fmt"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateCheckin(req models.CreateCheckinRequest) *models.CheckinRecord {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("CK%06d", s.checkinSeq)
	s.checkinSeq++

	var bookingNo string
	booking, ok := s.bookings[req.BookingID]
	if ok {
		bookingNo = booking.BookingNo
	}

	record := models.CheckinRecord{
		ID:           id,
		BookingID:    req.BookingID,
		BookingNo:    bookingNo,
		GateNo:       req.GateNo,
		CheckinTime:  time.Now(),
		VisitorCount: req.VisitorCount,
		CheckerName:  req.CheckerName,
		Remark:       req.Remark,
	}

	s.checkins[id] = record
	return &record
}

func (s *Store) ListCheckins() []models.CheckinRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.CheckinRecord, 0, len(s.checkins))
	for _, record := range s.checkins {
		result = append(result, record)
	}
	return result
}

func (s *Store) ListCheckinsByBooking(bookingID string) []models.CheckinRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []models.CheckinRecord
	for _, record := range s.checkins {
		if record.BookingID == bookingID {
			result = append(result, record)
		}
	}
	return result
}
'''

files['internal/store/complaint.go'] = '''package store

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
'''

files['internal/store/notification.go'] = '''package store

import (
	"fmt"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateNotification(title, content string, targetRole models.Role, targetUser string, relatedType, relatedID string) *models.Notification {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.notificationSeq++
	id := fmt.Sprintf("NF%06d", s.notificationSeq)

	now := time.Now()
	notification := models.Notification{
		ID:          id,
		Title:       title,
		Content:     content,
		TargetRole:  targetRole,
		TargetUser:  targetUser,
		RelatedType: relatedType,
		RelatedID:   relatedID,
		Status:      models.NotificationUnread,
		CreatedAt:   now,
	}

	s.notifications[id] = notification
	return &notification
}

func (s *Store) ListNotificationsByRole(role models.Role) []models.Notification {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []models.Notification
	for _, n := range s.notifications {
		if n.TargetRole == role {
			result = append(result, n)
		}
	}
	return result
}

func (s *Store) ListNotificationsByUser(user string) []models.Notification {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []models.Notification
	for _, n := range s.notifications {
		if n.TargetUser == user {
			result = append(result, n)
		}
	}
	return result
}

func (s *Store) ListAllNotifications() []models.Notification {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.Notification, 0, len(s.notifications))
	for _, n := range s.notifications {
		result = append(result, n)
	}
	return result
}

func (s *Store) MarkNotificationRead(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	n, exists := s.notifications[id]
	if !exists {
		return false
	}

	now := time.Now()
	n.Status = models.NotificationRead
	n.ReadAt = &now
	s.notifications[id] = n
	return true
}
'''

import os
base = '/Users/liu/Documents/private/model-test/trae-20260601-3'
for path, content in files.items():
    full_path = os.path.join(base, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f'Written: {path}')

print('All files written successfully!')
