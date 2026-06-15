package handlers

import (
	"moving-company/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (h *Handler) BatchAssign() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req BatchAssignReq
		if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		for _, ci := range req.CrewList {
			asgn := &models.CrewAssignment{ScheduleID:req.ScheduleID,CrewID:ci.CrewID,BookingID:req.BookingID,Role:ci.Role,Status:models.AssignmentPending}
			if e := h.DB.Create(asgn).Error; e != nil { continue }
			rid := req.ScheduleID
			h.createNotification(ci.CrewID, models.NotificationAssignment, "新派工", "您有新的派工通知", &rid)
		}
		return c.JSON(fiber.Map{"message":"ok"})
	}
}

func (h *Handler) ListAssignments() fiber.Handler {
	return func(c *fiber.Ctx) error {
		page:=c.QueryInt("page",1); ps:=c.QueryInt("page_size",20)
		cid:=c.Query("crew_id"); sid:=c.Query("schedule_id"); status:=c.Query("status"); sd:=c.Query("start_date"); ed:=c.Query("end_date")
		q:=h.DB.Model(&models.CrewAssignment{})
		if cid!="" { q=q.Where("crew_id=?",cid) }
		if sid!="" { q=q.Where("schedule_id=?",sid) }
		if status!="" { q=q.Where("status=?",status) }
		if sd!="" { if t,e:=time.Parse("2006-01-02",sd); e==nil { q=q.Where("created_at>=?",t) } }
		if ed!="" { if t,e:=time.Parse("2006-01-02",ed); e==nil { t2:=t.Add(24*time.Hour); q=q.Where("created_at<?",t2) } }
		q = q.Preload("Schedule").Preload("Booking").Preload("Crew")
		var d []models.CrewAssignment
		r,e:=models.Paginate(q.Order("created_at DESC"),page,ps,&d)
		if e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }
		return c.JSON(r)
	}
}

func (h *Handler) UpdateAssignment() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id,e:=uuid.Parse(c.Params("id"))
		if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		var a2 models.CrewAssignment
		if e:=h.DB.First(&a2,id).Error; e!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
		var req UpdateAssignmentReq
		if e:=c.BodyParser(&req); e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		now:=time.Now()
		switch req.Status {
		case models.AssignmentAccepted, models.AssignmentRejected:
			if req.Status == models.AssignmentRejected {
				a2.RejectCount++
				a2.RejectReason = req.RejectReason
			}
		case models.AssignmentArrived:
			a2.ArrivedAt = &now
		case models.AssignmentCompleted:
			a2.CompletedAt = &now
		}
		a2.Status = req.Status
		if e:=h.DB.Save(&a2).Error; e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }
		h.DB.Preload("Schedule").Preload("Booking").Preload("Crew").First(&a2,id)
		return c.JSON(a2)
	}
}

func (h *Handler) GetCrewReview() fiber.Handler {
	return func(c *fiber.Ctx) error {
		cidStr := c.Params("member_id")
		if cidStr == "" { cidStr = c.Query("member_id") }
		if cidStr == "" { cidStr = c.Query("crew_id") }
		if cidStr == "" { return c.Status(400).JSON(fiber.Map{"error":"no crew_id"}) }
		cid,e:=uuid.Parse(cidStr)
		if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }
		sd:=c.Query("start_date"); ed:=c.Query("end_date")
		if sd == "" && ed == "" {
			now := time.Now()
			defaultStart := now.AddDate(0, 0, -30)
			sd = defaultStart.Format("2006-01-02")
			ed = now.Format("2006-01-02")
		}
		q:=h.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid)
		if sd!="" { if t,e:=time.Parse("2006-01-02",sd); e==nil { q=q.Where("created_at>=?",t) } }
		if ed!="" { if t,e:=time.Parse("2006-01-02",ed); e==nil { t2:=t.Add(24*time.Hour); q=q.Where("created_at<?",t2) } }
		var list []models.CrewAssignment
		q.Preload("Schedule").Preload("Booking").Preload("Crew").Order("created_at DESC").Find(&list)
		var cnt, cc, rc int64
		h.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid).Count(&cnt)
		h.DB.Model(&models.CrewAssignment{}).Where("crew_id=? AND status=?",cid,models.AssignmentCompleted).Count(&cc)
		var all []models.CrewAssignment
		h.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid).Find(&all)
		for _, x := range all { rc += int64(x.RejectCount) }
		return c.JSON(fiber.Map{"count":cnt,"completed_count":cc,"total_reject_count":rc,"assignments":list})
	}
}
