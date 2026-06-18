package store

import (
	"fmt"
	"strings"
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
		Status:        models.BookingConfirmed,
		Remark:        req.Remark,
		CreatedAt:     now,
		UpdatedAt:     now,
		CreatedBy:     req.Operator,
	}

	var operatorRole models.Role
	if strings.Contains(req.Operator, "票务主管") {
		operatorRole = models.RoleTicketSupervisor
	} else {
		operatorRole = models.RoleCustomerService
	}
	s.addChangeLogLocked(id, "create", "", "", "", req.Remark, req.Operator, operatorRole)
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

	var operatorRole models.Role
	if strings.Contains(req.Operator, "票务主管") {
		operatorRole = models.RoleTicketSupervisor
	} else {
		operatorRole = models.RoleCustomerService
	}

	keyFieldsChanged := false

	if req.VisitorCount != nil {
		oldVal := fmt.Sprintf("%d", booking.VisitorCount)
		newVal := fmt.Sprintf("%d", *req.VisitorCount)
		booking.VisitorCount = *req.VisitorCount
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "visitor_count", oldVal, newVal, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.VisitDate != nil && *req.VisitDate != booking.VisitDate {
		booking.VisitDate = *req.VisitDate
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "visit_date", oldBooking.VisitDate, *req.VisitDate, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.VisitTimeSlot != nil && *req.VisitTimeSlot != booking.VisitTimeSlot {
		booking.VisitTimeSlot = *req.VisitTimeSlot
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "visit_time_slot", oldBooking.VisitTimeSlot, *req.VisitTimeSlot, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.TicketType != nil && *req.TicketType != booking.TicketType {
		booking.TicketType = *req.TicketType
		s.addChangeLogLocked(id, "update", "ticket_type", oldBooking.TicketType, *req.TicketType, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.GuideRequired != nil && *req.GuideRequired != booking.GuideRequired {
		oldVal := fmt.Sprintf("%t", booking.GuideRequired)
		newVal := fmt.Sprintf("%t", *req.GuideRequired)
		booking.GuideRequired = *req.GuideRequired
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "guide_required", oldVal, newVal, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.GuideLanguage != nil && *req.GuideLanguage != booking.GuideLanguage {
		booking.GuideLanguage = *req.GuideLanguage
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "guide_language", oldBooking.GuideLanguage, *req.GuideLanguage, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.Status != nil && models.BookingStatus(*req.Status) != booking.Status {
		oldStatus := string(booking.Status)
		newStatus := *req.Status
		booking.Status = models.BookingStatus(*req.Status)
		s.addChangeLogLocked(id, "status_change", "status", oldStatus, newStatus, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.Remark != nil && *req.Remark != booking.Remark {
		booking.Remark = *req.Remark
		s.addChangeLogLocked(id, "update", "remark", oldBooking.Remark, *req.Remark, req.ChangeReason, req.Operator, operatorRole)
	}

	booking.UpdatedAt = time.Now()
	s.bookings[id] = booking

	if keyFieldsChanged && booking.Status != models.BookingCancelled && booking.Status != models.BookingCompleted {
		isFirstChange := oldBooking.Status == models.BookingConfirmed
		if isFirstChange {
			booking.Status = models.BookingModified
			s.bookings[id] = booking
			s.addChangeLogLocked(id, "status_change", "status", string(models.BookingConfirmed), string(models.BookingModified), "关键信息变更，状态自动更新", req.Operator, operatorRole)
		}
		s.adjustSchedulesForBookingLocked(id, req.ChangeReason)
		notificationTitle := "预约信息变更"
		notificationContentGuide := "预约 " + booking.BookingNo + " 的关键信息已变更，请关注排班调整"
		notificationContentSupervisor := "预约 " + booking.BookingNo + " 的关键信息已变更，请关注"
		if !isFirstChange {
			notificationTitle = "预约再次变更"
			notificationContentGuide = "预约 " + booking.BookingNo + " 再次发生变更，请关注最新排班调整"
			notificationContentSupervisor = "预约 " + booking.BookingNo + " 再次发生变更，请关注"
		}
		s.createNotificationLocked(
			notificationTitle,
			notificationContentGuide,
			models.RoleGuide,
			"",
			"booking",
			id,
		)
		s.createNotificationLocked(
			notificationTitle,
			notificationContentSupervisor,
			models.RoleTicketSupervisor,
			"",
			"booking",
			id,
		)
	}

	return &booking, true
}

func (s *Store) addChangeLogLocked(bookingID, changeType, fieldChanged, oldValue, newValue, changeReason, changedBy string, changedByRole models.Role) {
	id := fmt.Sprintf("LG%06d", s.changeLogSeq)
	s.changeLogSeq++

	log := models.BookingChangeLog{
		ID:            id,
		BookingID:     bookingID,
		ChangeType:    changeType,
		FieldChanged:  fieldChanged,
		OldValue:      oldValue,
		NewValue:      newValue,
		ChangeReason:  changeReason,
		ChangedBy:     changedBy,
		ChangedByRole: changedByRole,
		ChangedAt:     time.Now(),
	}

	s.changeLogs[bookingID] = append(s.changeLogs[bookingID], log)
}

func (s *Store) GetBookingChangeLogs(bookingID string) []models.BookingChangeLog {
	s.mu.RLock()
	defer s.mu.RUnlock()

	logs := make([]models.BookingChangeLog, len(s.changeLogs[bookingID]))
	copy(logs, s.changeLogs[bookingID])
	return logs
}

func (s *Store) GetBookingDetail(id string) (*models.BookingDetail, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	booking, ok := s.bookings[id]
	if !ok {
		return nil, false
	}

	changeLogs := make([]models.BookingChangeLog, len(s.changeLogs[id]))
	copy(changeLogs, s.changeLogs[id])

	var schedules []models.GuideSchedule
	for _, sc := range s.schedules {
		if sc.BookingID == id {
			schedules = append(schedules, sc)
		}
	}

	var checkins []models.CheckinRecord
	for _, ci := range s.checkins {
		if ci.BookingID == id {
			checkins = append(checkins, ci)
		}
	}

	var complaints []models.Complaint
	for _, cp := range s.complaints {
		if cp.BookingID == id {
			complaints = append(complaints, cp)
		}
	}

	detail := &models.BookingDetail{
		Booking:    booking,
		ChangeLogs: changeLogs,
		Schedules:  schedules,
		Checkins:   checkins,
		Complaints: complaints,
	}

	return detail, true
}
