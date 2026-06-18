import os

with open("internal/store/complaint.go", "r") as f:
    content = f.read()

content = content.replace("\"time\"", "\"sort\"\\n\\t\"time\"")

new_method = "\\n\\nfunc (s *Store) GetComplaintDetail(id string) (*models.ComplaintDetail, bool) {\\n\\ts.mu.RLock()\\n\\tdefer s.mu.RUnlock()\\n\\n\\tcomplaint, ok := s.complaints[id]\\n\\tif !ok {\\n\\t\\treturn nil, false\\n\\t}\\n\\n\\tdetail := &models.ComplaintDetail{\\n\\t\\tComplaint:     complaint,\\n\\t\\tBooking:       nil,\\n\\t\\tSchedule:      nil,\\n\\t\\tChangeLogs:    []models.BookingChangeLog{},\\n\\t\\tCheckins:      []models.CheckinRecord{},\\n\\t\\tNotifications: []models.Notification{},\\n\\t}\\n\\n\\tbookingID := complaint.BookingID\\n\\n\\tif bookingID != \"\" {\\n\\t\\tbooking, ok := s.bookings[bookingID]\\n\\t\\tif ok {\\n\\t\\t\\tb := booking\\n\\t\\t\\tdetail.Booking = &b\\n\\t\\t\\tlogs := make([]models.BookingChangeLog, len(s.changeLogs[bookingID]))\\n\\t\\t\\tcopy(logs, s.changeLogs[bookingID])\\n\\t\\t\\tdetail.ChangeLogs = logs\\n\\n\\t\\t\\tcheckins := make([]models.CheckinRecord, 0)\\n\\t\\t\\tfor _, ci := range s.checkins {\\n\\t\\t\\t\\tif ci.BookingID == bookingID {\\n\\t\\t\\t\\t\\tcheckins = append(checkins, ci)\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tsort.Slice(checkins, func(i, j int) bool {\\n\\t\\t\\t\\treturn checkins[i].CheckinTime.Before(checkins[j].CheckinTime)\\n\\t\\t\\t})\\n\\t\\t\\tdetail.Checkins = checkins\\n\\t\\t}\\n\\t}\\n\\n\\tif complaint.ScheduleID != \"\" {\\n\\t\\tschedule, ok := s.schedules[complaint.ScheduleID]\\n\\t\\tif ok {\\n\\t\\t\\tsc := schedule\\n\\t\\t\\tdetail.Schedule = &sc\\n\\t\\t}\\n\\t}\\n\\n\\tnotifications := make([]models.Notification, 0)\\n\\tfor _, n := range s.notifications {\\n\\t\\tif (n.RelatedType == \"complaint\" && n.RelatedID == id) ||\\n\\t\\t\\t(n.RelatedType == \"booking\" && n.RelatedID == bookingID) {\\n\\t\\t\\tnotifications = append(notifications, n)\\n\\t\\t}\\n\\t}\\n\\tdetail.Notifications = notifications\\n\\n\\treturn detail, true\\n}\\n"
content += new_method

with open("internal/store/complaint.go", "w") as f:
    f.write(content)

print("Done!")
