package store

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
