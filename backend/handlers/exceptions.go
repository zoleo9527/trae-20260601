package handlers

import (
	"moving-company/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (h *Handler) CreateException() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req CreateExceptionReq
		if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		exc := &models.ExceptionRecord{BookingID:req.BookingID,ScheduleID:req.ScheduleID,ReporterID:req.ReporterID,Type:req.Type,Title:req.Title,Description:req.Description,RefundAmount:req.RefundAmount,SurchargeAmount:req.SurchargeAmount,Status:models.ExceptionPending}
		err := h.DB.Transaction(func(tx *gorm.DB) error {
			if e := tx.Create(exc).Error; e != nil { return e }
			for _, ph := range req.Photos {
				photo := &models.DamagePhoto{BookingID:req.BookingID,ExceptionID:exc.ID,UploaderID:req.ReporterID,URL:ph.URL,FileName:ph.FileName,Description:ph.Description}
				if e := tx.Create(photo).Error; e != nil { return e }
			}
			rid := exc.ID
			for _, du := range h.getUserIDsByRole(models.RoleDispatcher) {
				h.createNotification(du, models.NotificationException, "异常通知", "有新异常需处理", &rid)
			}
			for _, du := range h.getUserIDsByRole(models.RoleCustomer) {
				h.createNotification(du, models.NotificationException, "异常通知", "有新异常需处理", &rid)
			}
			if req.Type == models.ExceptionDelay {
				tx.Model(&models.Booking{}).Where("id=?",req.BookingID).Update("status",models.BookingDelayed)
			} else if req.Type == models.ExceptionSurcharge {
				tx.Model(&models.Booking{}).Where("id=?",req.BookingID).Update("status",models.BookingSurcharged)
			}
			return nil
		})
		if err != nil { return c.Status(500).JSON(fiber.Map{"error":err.Error()}) }
		var res models.ExceptionRecord
		h.DB.Preload("Booking").Preload("Schedule").Preload("Photos").First(&res, exc.ID)
		return c.Status(201).JSON(res)
	}
}

func (h *Handler) ListExceptions() fiber.Handler {
	return func(c *fiber.Ctx) error {
		page:=c.QueryInt("page",1); ps:=c.QueryInt("page_size",20)
		bid:=c.Query("booking_id"); status:=c.Query("status"); typ:=c.Query("type")
		q:=h.DB.Model(&models.ExceptionRecord{})
		if bid!="" { q=q.Where("booking_id=?",bid) }
		if status!="" { q=q.Where("status=?",status) }
		if typ!="" { q=q.Where("type=?",typ) }
		var d []models.ExceptionRecord
		r,e:=models.Paginate(q.Preload("Booking").Preload("Photos").Preload("Schedule").Order("created_at DESC"),page,ps,&d)
		if e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }
		return c.JSON(r)
	}
}

func (h *Handler) HandleException() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id,e:=uuid.Parse(c.Params("id"))
		if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		var exc models.ExceptionRecord
		if e:=h.DB.First(&exc,id).Error; e!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
		var req HandleExceptionReq
		if e:=c.BodyParser(&req); e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		now:=time.Now()
		if req.Status == models.ExceptionRejected {
			exc.RejectCount++
			exc.RejectReason = req.RejectReason
			exc.Status = req.Status
		} else if req.Status == models.ExceptionRefunded {
			exc.Status = req.Status
			exc.HandlerID = &req.HandlerID
			exc.HandleRemark = req.HandleRemark
			exc.HandledAt = &now
			var b models.Booking
			if h.DB.First(&b,exc.BookingID).Error == nil {
				b.ExtraPrice -= req.RefundAmount
				b.TotalPrice = b.BasePrice + b.ExtraPrice
				h.DB.Save(&b)
			}
		} else if req.Status == models.ExceptionResolved {
			exc.Status = req.Status
			exc.HandlerID = &req.HandlerID
			exc.HandleRemark = req.HandleRemark
			exc.HandledAt = &now
			if req.SurchargeAmount > 0 {
				var b models.Booking
				if h.DB.First(&b,exc.BookingID).Error == nil {
					b.ExtraPrice += req.SurchargeAmount
					b.TotalPrice = b.BasePrice + b.ExtraPrice
					h.DB.Save(&b)
				}
			}
		} else {
			exc.Status = req.Status
			exc.HandlerID = &req.HandlerID
			exc.HandleRemark = req.HandleRemark
			exc.HandledAt = &now
		}
		if e:=h.DB.Save(&exc).Error; e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }
		rid := exc.ID
		h.createNotification(exc.ReporterID, models.NotificationException, "异常处理结果", "您报告的异常已处理", &rid)
		h.DB.Preload("Booking").Preload("Schedule").Preload("Photos").First(&exc,id)
		return c.JSON(exc)
	}
}

func (h *Handler) TriggerTestException() fiber.Handler {
	return func(c *fiber.Ctx) error {
		bid,e:=uuid.Parse(c.Params("booking_id"))
		if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		typ := c.Query("type","delay")
		var b models.Booking
		if e:=h.DB.First(&b,bid).Error; e!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
		var sched models.VehicleSchedule
		h.DB.Where("booking_id=?",bid).First(&sched)
		var reporterID uuid.UUID
		var asgn models.CrewAssignment
		if h.DB.Where("booking_id=?",bid).First(&asgn).Error == nil {
			reporterID = asgn.CrewID
		} else {
			for _, du := range h.getUserIDsByRole(models.RoleLeader) {
				reporterID = du; break
			}
		}
		var excType models.ExceptionType
		var title, desc string
		var refund, surcharge float64
		photos := make([]struct { URL string `json:"url"`; FileName string `json:"file_name"`; Description string `json:"description"` }, 0)
		switch typ {
		case "delay":
			excType = models.ExceptionDelay; title = "车辆迟到45分钟"; desc = "高速堵车"
		case "surcharge":
			excType = models.ExceptionSurcharge; title = "临时加价"; desc = "现场有额外大件(保险柜2个)"; surcharge = 500
		case "damage":
			excType = models.ExceptionDamage; title = "客厅玻璃茶几破碎"; desc = "搬运过程中意外破损"
			photos = append(photos, struct { URL string `json:"url"`; FileName string `json:"file_name"`; Description string `json:"description"` }{URL:"https://example.com/dmg1.jpg",FileName:"breakage1.jpg",Description:"茶几破损照片1"})
			photos = append(photos, struct { URL string `json:"url"`; FileName string `json:"file_name"`; Description string `json:"description"` }{URL:"https://example.com/dmg2.jpg",FileName:"breakage2.jpg",Description:"茶几破损照片2"})
		default:
			excType = models.ExceptionDelay; title = "异常"; desc = "测试异常"
		}
		sid := sched.ID
		req := CreateExceptionReq{BookingID:bid,ScheduleID:sid,ReporterID:reporterID,Type:excType,Title:title,Description:desc,RefundAmount:refund,SurchargeAmount:surcharge}
		for _, ph := range photos { req.Photos = append(req.Photos, ph) }
		exc := &models.ExceptionRecord{BookingID:req.BookingID,ScheduleID:req.ScheduleID,ReporterID:req.ReporterID,Type:req.Type,Title:req.Title,Description:req.Description,RefundAmount:req.RefundAmount,SurchargeAmount:req.SurchargeAmount,Status:models.ExceptionPending}
		err := h.DB.Transaction(func(tx *gorm.DB) error {
			if e := tx.Create(exc).Error; e != nil { return e }
			for _, ph := range req.Photos {
				photo := &models.DamagePhoto{BookingID:req.BookingID,ExceptionID:exc.ID,UploaderID:req.ReporterID,URL:ph.URL,FileName:ph.FileName,Description:ph.Description}
				if e := tx.Create(photo).Error; e != nil { return e }
			}
			rid := exc.ID
			for _, du := range h.getUserIDsByRole(models.RoleDispatcher) { h.createNotification(du, models.NotificationException, "异常通知", "有新异常需处理", &rid) }
			for _, du := range h.getUserIDsByRole(models.RoleCustomer) { h.createNotification(du, models.NotificationException, "异常通知", "有新异常需处理", &rid) }
			if req.Type == models.ExceptionDelay { tx.Model(&models.Booking{}).Where("id=?",req.BookingID).Update("status",models.BookingDelayed) }
			if req.Type == models.ExceptionSurcharge { tx.Model(&models.Booking{}).Where("id=?",req.BookingID).Update("status",models.BookingSurcharged) }
			return nil
		})
		if err != nil { return c.Status(500).JSON(fiber.Map{"error":err.Error()}) }
		var res models.ExceptionRecord
		h.DB.Preload("Booking").Preload("Schedule").Preload("Photos").First(&res, exc.ID)
		return c.JSON(res)
	}
}
