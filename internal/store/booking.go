package store

import (
	"fmt"
	"sort"
	"strconv"
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

func (s *Store) adjustSchedulesForBookingLocked(bookingID string, reason string) {
	booking, ok := s.bookings[bookingID]
	if !ok {
		return
	}

	var startTime, endTime string
	if parts := strings.Split(booking.VisitTimeSlot, "-"); len(parts) == 2 {
		startTime = parts[0]
		endTime = parts[1]
	}

	for id, schedule := range s.schedules {
		if schedule.BookingID == bookingID {
			schedule.Status = models.ScheduleAdjusted
			schedule.VisitDate = booking.VisitDate
			schedule.VisitTimeSlot = booking.VisitTimeSlot
			schedule.VisitorCount = booking.VisitorCount
			schedule.GuideLanguage = booking.GuideLanguage
			if startTime != "" {
				schedule.StartTime = startTime
			}
			if endTime != "" {
				schedule.EndTime = endTime
			}
			if schedule.Remark == "" {
				schedule.Remark = reason
			}
			schedule.UpdatedAt = time.Now()
			s.schedules[id] = schedule
		}
	}
}


func (s *Store) createNotificationLocked(title, content string, targetRole models.Role, targetUser string, relatedType, relatedID string) {
	s.notificationSeq++
	id := fmt.Sprintf("NF%06d", s.notificationSeq)

	notification := models.Notification{
		ID:          id,
		Title:       title,
		Content:     content,
		TargetRole:  targetRole,
		TargetUser:  targetUser,
		RelatedType: relatedType,
		RelatedID:   relatedID,
		Status:      models.NotificationUnread,
		CreatedAt:   time.Now(),
	}

	s.notifications[id] = notification
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

func (s *Store) GetBookingTimeline(bookingID string) (*models.TimelineResponse, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	booking, ok := s.bookings[bookingID]
	if !ok {
		return nil, false
	}

	resp := &models.TimelineResponse{
		BookingNo: booking.BookingNo,
		TeamName:  booking.TeamName,
		Events:    []models.TimelineEvent{},
	}

	resp.Events = append(resp.Events, models.TimelineEvent{
		EventType:   models.TimelineBookingCreated,
		EventTime:   booking.CreatedAt,
		Title:       "预约创建",
		Content:     "创建成功，状态：已确认",
		Operator:    booking.CreatedBy,
		OperatorRole: models.RoleTicketSupervisor,
		RelatedID:   booking.ID,
		RawData:     booking,
	})

	for _, log := range s.changeLogs[bookingID] {
		if log.ChangeType == "create" {
			continue
		}
		content := log.ChangeReason
		if log.FieldChanged != "" {
			content = log.ChangeReason + "，变更字段：" + log.FieldChanged
			if log.OldValue != "" && log.NewValue != "" {
				content += "（" + log.OldValue + " → " + log.NewValue + "）"
			}
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineBookingChanged,
			EventTime:    log.ChangedAt,
			Title:        "预约变更",
			Content:      content,
			Operator:     log.ChangedBy,
			OperatorRole: log.ChangedByRole,
			RelatedID:    log.ID,
			RawData:      log,
		})
	}

	for _, sc := range s.schedules {
		if sc.BookingID != bookingID {
			continue
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineScheduleCreated,
			EventTime:    sc.CreatedAt,
			Title:        "讲解排班创建",
			Content:      "讲解员：" + sc.GuideName + "，时间：" + sc.VisitDate + " " + sc.StartTime + "-" + sc.EndTime,
			Operator:     "系统",
			OperatorRole: models.RoleTicketSupervisor,
			RelatedID:    sc.ID,
			RawData:      sc,
		})
		if sc.Status == models.ScheduleAdjusted {
			resp.Events = append(resp.Events, models.TimelineEvent{
				EventType:    models.TimelineScheduleAdjusted,
				EventTime:    sc.UpdatedAt,
				Title:        "讲解排班已调整",
				Content:      sc.Remark,
				Operator:     "系统",
				OperatorRole: models.RoleTicketSupervisor,
				RelatedID:    sc.ID,
				RawData:      sc,
			})
		}
	}

	for _, ci := range s.checkins {
		if ci.BookingID != bookingID {
			continue
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineCheckin,
			EventTime:    ci.CheckinTime,
			Title:        "检票入园",
			Content:      "闸机号：" + ci.GateNo + "，人数：" + strconv.Itoa(ci.VisitorCount),
			Operator:     ci.CheckerName,
			OperatorRole: models.RoleTicketChecker,
			RelatedID:    ci.ID,
			RawData:      ci,
		})
	}

	for _, cp := range s.complaints {
		if cp.BookingID != bookingID {
			continue
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineComplaintCreated,
			EventTime:    cp.CreatedAt,
			Title:        "投诉提交",
			Content:      "投诉类型：" + cp.ComplaintType + "，内容：" + cp.Content,
			Operator:     cp.Complainant,
			OperatorRole: models.RoleCustomerService,
			RelatedID:    cp.ID,
			RawData:      cp,
		})
		if cp.HandledAt != nil {
			resp.Events = append(resp.Events, models.TimelineEvent{
				EventType:    models.TimelineComplaintHandled,
				EventTime:    *cp.HandledAt,
				Title:        "投诉处理",
				Content:      cp.HandleResult,
				Operator:     cp.Handler,
				OperatorRole: models.RoleCustomerService,
				RelatedID:    cp.ID,
				RawData:      cp,
			})
		}
	}

	for _, n := range s.notifications {
		if n.RelatedID != bookingID {
			continue
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineNotification,
			EventTime:    n.CreatedAt,
			Title:        "通知推送",
			Content:      n.Title + "：" + n.Content,
			Operator:     "系统",
			OperatorRole: n.TargetRole,
			RelatedID:    n.ID,
			RawData:      n,
		})
	}

	sort.Slice(resp.Events, func(i, j int) bool {
		return resp.Events[i].EventTime.Before(resp.Events[j].EventTime)
	})

	return resp, true
}
