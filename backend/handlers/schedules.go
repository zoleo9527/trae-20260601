package handlers

import (
	"moving-company/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (h *Handler) CreateScheduleAndAssign() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req CreateScheduleReq
		if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		sched := &models.VehicleSchedule{VehicleID:req.VehicleID,BookingID:req.BookingID,PlannedStart:req.PlannedStart,PlannedEnd:req.PlannedEnd,Status:models.ScheduleCreated,Remarks:req.Remarks}
		err := h.DB.Transaction(func(tx *gorm.DB) error {
			if e := tx.Create(sched).Error; e != nil { return e }
			if e := tx.Model(&models.Vehicle{}).Where("id=?",req.VehicleID).Update("status",models.VehicleAssigned).Error; e != nil { return e }
			sid := sched.ID; vehID := sched.VehicleID
			if e := tx.Model(&models.Booking{}).Where("id=?",req.BookingID).Updates(map[string]interface{}{"status":models.BookingAssigned,"vehicle_id":vehID,"schedule_id":sid}).Error; e!=nil { return e }
			for _, ci := range req.CrewList {
				asgn := &models.CrewAssignment{ScheduleID:sched.ID,CrewID:ci.CrewID,BookingID:req.BookingID,Role:ci.Role,Status:models.AssignmentPending}
				if e := tx.Create(asgn).Error; e != nil { return e }
				rid := sched.ID
				h.createNotificationTx(tx, ci.CrewID, models.NotificationAssignment, "新派工", "您有新的搬家任务", &rid)
			}
			for _, du := range h.getUserIDsByRole(models.RoleDispatcher) {
				rid := sched.ID
				h.createNotificationTx(tx, du, models.NotificationSchedule, "新排班", "有新的排班已创建", &rid)
			}
			return nil
		})
		if err != nil { return c.Status(500).JSON(fiber.Map{"error":err.Error()}) }
		var res models.VehicleSchedule
		h.DB.Preload("Vehicle").Preload("Booking").Preload("Assignments").Preload("Assignments.Crew").First(&res, sched.ID)
		return c.Status(201).JSON(res)
	}
}

func (h *Handler) ListSchedules() fiber.Handler {
	return func(c *fiber.Ctx) error {
		page:=c.QueryInt("page",1); ps:=c.QueryInt("page_size",20)
		vid:=c.Query("vehicle_id"); bid:=c.Query("booking_id"); status:=c.Query("status"); date:=c.Query("date")
		q:=h.DB.Model(&models.VehicleSchedule{})
		if vid!="" { q=q.Where("vehicle_id=?",vid) }
		if bid!="" { q=q.Where("booking_id=?",bid) }
		if status!="" { q=q.Where("status=?",status) }
		if date!="" { if t,e:=time.Parse("2006-01-02",date); e==nil { q=q.Where("DATE(planned_start)=?",t.Format("2006-01-02")) } }
		var d []models.VehicleSchedule
		r,e:=models.Paginate(q.Order("planned_start DESC"),page,ps,&d)
		if e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }
		return c.JSON(r)
	}
}

func (h *Handler) GetSchedule() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id,e:=uuid.Parse(c.Params("id"))
		if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		var s models.VehicleSchedule
		if e:=h.DB.Preload("Vehicle").Preload("Booking").Preload("Assignments").Preload("Assignments.Crew").First(&s,id).Error; e!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
		return c.JSON(s)
	}
}

func (h *Handler) UpdateScheduleStatus() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id,e:=uuid.Parse(c.Params("id"))
		if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }
		var req UpdateScheduleStatusReq
		if e:=c.BodyParser(&req); e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		var s models.VehicleSchedule
		if e:=h.DB.First(&s,id).Error; e!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
		s.Status = req.Status
		now:=time.Now()
		switch req.Status {
		case models.ScheduleDeparted:
			s.ActualStart = &now
			h.DB.Model(&models.Booking{}).Where("id=?",s.BookingID).Update("status",models.BookingInProgress)
		case models.ScheduleArrived, models.ScheduleLoading, models.ScheduleMoving, models.ScheduleUnloading:
			h.DB.Model(&models.Booking{}).Where("id=?",s.BookingID).Update("status",models.BookingInProgress)
		case models.ScheduleDone:
			s.ActualEnd = &now
			h.DB.Model(&models.Booking{}).Where("id=?",s.BookingID).Update("status",models.BookingCompleted)
		case models.ScheduleException:
			h.DB.Model(&models.Booking{}).Where("id=?",s.BookingID).Update("status",models.BookingDelayed)
		}
		if req.Status == models.ScheduleDeparted {
			h.DB.Model(&models.CrewAssignment{}).Where("schedule_id=? AND status=?",id,models.AssignmentAccepted).Update("status",models.AssignmentArrived)
		}
		if req.Status == models.ScheduleDone {
			h.DB.Model(&models.CrewAssignment{}).Where("schedule_id=? AND status!=?",id,models.AssignmentRejected).Update("status",models.AssignmentCompleted).Update("completed_at",&now)
		}
		if e:=h.DB.Save(&s).Error; e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }
		h.DB.Preload("Vehicle").Preload("Booking").Preload("Assignments").Preload("Assignments.Crew").First(&s,id)
		return c.JSON(s)
	}
}

func (h *Handler) GetTimeline() fiber.Handler {
	return func(c *fiber.Ctx) error {
		dateStr := c.Params("date")
		t, e := time.Parse("2006-01-02", dateStr)
		if e != nil { return c.Status(400).JSON(fiber.Map{"error":"bad date"}) }
		var list []models.VehicleSchedule
		dateCond := t.Format("2006-01-02")
		h.DB.Preload("Vehicle").Preload("Booking").Where("DATE(planned_start)=?", dateCond).Order("planned_start").Find(&list)
		groups := make(map[string][]models.VehicleSchedule)
		for _, s := range list {
			vid := s.VehicleID.String()
			groups[vid] = append(groups[vid], s)
		}
		return c.JSON(fiber.Map{"date": dateCond, "by_vehicle": groups, "items": list})
	}
}
