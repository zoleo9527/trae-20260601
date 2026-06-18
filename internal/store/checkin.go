package store

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
