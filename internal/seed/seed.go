package seed

import (
	"scenic-ticket-system/internal/models"
	"scenic-ticket-system/internal/store"
)

func Seed(s *store.Store) {
	booking1 := s.CreateBooking(models.CreateBookingRequest{
		TeamName:      "阳光旅行团",
		ContactName:   "张三",
		ContactPhone:  "13800138001",
		VisitorCount:  25,
		VisitDate:     "2026-06-20",
		VisitTimeSlot: "09:00-12:00",
		TicketType:    "adult",
		GuideRequired: true,
		GuideLanguage: "中文",
		Remark:        "团体票，需要讲解员",
		Operator:      "票务主管-李经理",
	})

	booking2 := s.CreateBooking(models.CreateBookingRequest{
		TeamName:      "红星小学",
		ContactName:   "王老师",
		ContactPhone:  "13900139002",
		VisitorCount:  45,
		VisitDate:     "2026-06-21",
		VisitTimeSlot: "10:00-14:00",
		TicketType:    "student",
		GuideRequired: true,
		GuideLanguage: "中文",
		Remark:        "学生团体，优惠票",
		Operator:      "票务主管-李经理",
	})

	_ = s.CreateBooking(models.CreateBookingRequest{
		TeamName:      "自由行散客",
		ContactName:   "赵六",
		ContactPhone:  "13700137003",
		VisitorCount:  5,
		VisitDate:     "2026-06-22",
		VisitTimeSlot: "14:00-17:00",
		TicketType:    "adult",
		GuideRequired: false,
		Remark:        "散客，不需要讲解",
		Operator:      "客服-小陈",
	})

	s.CreateSchedule(models.CreateScheduleRequest{
		BookingID:     booking1.ID,
		GuideID:       "G001",
		GuideName:     "讲解员-刘导",
		GuideLanguage: "中文",
		VisitDate:     "2026-06-20",
		StartTime:     "09:00",
		EndTime:       "11:30",
		Remark:        "上午场讲解",
	})

	schedule2 := s.CreateSchedule(models.CreateScheduleRequest{
		BookingID:     booking2.ID,
		GuideID:       "G002",
		GuideName:     "讲解员-陈导",
		GuideLanguage: "中文",
		VisitDate:     "2026-06-21",
		StartTime:     "10:00",
		EndTime:       "12:30",
		Remark:        "学生团讲解",
	})

	s.CreateCheckin(models.CreateCheckinRequest{
		BookingID:    booking1.ID,
		GateNo:       "1号门",
		VisitorCount: 25,
		CheckerName:  "检票员-孙师傅",
		Remark:       "全员到齐",
	})

	s.CreateCheckin(models.CreateCheckinRequest{
		BookingID:    booking2.ID,
		GateNo:       "2号门",
		VisitorCount: 40,
		CheckerName:  "检票员-周师傅",
		Remark:       "5名学生请假未到",
	})

	complaint1 := s.CreateComplaint(models.CreateComplaintRequest{
		BookingID:     booking2.ID,
		ScheduleID:    schedule2.ID,
		Complainant:   "王老师",
		ContactPhone:  "13900139002",
		ComplaintType: "服务态度",
		Content:       "讲解员讲解不够耐心，对学生问题回答敷衍",
	})

	newVisitorCount := 30
	newTimeSlot := "13:00-16:00"
	s.UpdateBooking(booking1.ID, models.UpdateBookingRequest{
		VisitorCount:  &newVisitorCount,
		VisitTimeSlot: &newTimeSlot,
		ChangeReason:  "团队人数调整，时间变更",
		Operator:      "票务主管-李经理",
	})
	newVisitorCount2 := 35
	newTimeSlot2 := "14:00-17:00"
	s.UpdateBooking(booking1.ID, models.UpdateBookingRequest{
		VisitorCount:  &newVisitorCount2,
		VisitTimeSlot: &newTimeSlot2,
		ChangeReason:  "人数再次调整，时间延后",
		Operator:      "票务主管-李经理",
	})

	s.HandleComplaint(complaint1.ID, models.HandleComplaintRequest{
		Handler:      "客服-小陈",
		HandleResult: "已与讲解员沟通，向游客致歉，赠送下次免费讲解券",
		Status:       "resolved",
	})
}
