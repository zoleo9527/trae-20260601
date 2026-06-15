package handlers

import (
	"moving-company/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (h *Handler) ListBookings() fiber.Handler {
	return func(c *fiber.Ctx) error {
		page := c.QueryInt("page",1); ps := c.QueryInt("page_size",20)
		status := c.Query("status"); df := c.Query("date_from"); dt := c.Query("date_to"); cust := c.Query("customer")
		q := h.DB.Model(&models.Booking{}).Preload("Vehicle").Preload("Schedule")
		if status!="" { q=q.Where("status = ?",status) }
		if cust!="" { q=q.Where("customer_name LIKE ? OR customer_phone LIKE ?", "%"+cust+"%", "%"+cust+"%") }
		if df!="" { if t,e:=time.Parse("2006-01-02",df); e==nil { q=q.Where("move_date >= ?",t) } }
		if dt!="" { if t,e:=time.Parse("2006-01-02",dt); e==nil { q=q.Where("move_date <= ?",t.Add(24*time.Hour)) } }
		var data []models.Booking
		res,err := models.Paginate(q.Order("created_at DESC"),page,ps,&data)
		if err!=nil { return c.Status(500).JSON(fiber.Map{"error":err.Error()}) }
		return c.JSON(res)
	}
}

func (h *Handler) GetBooking() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id,err := uuid.Parse(c.Params("id"))
		if err!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }
		var b models.Booking
		if err := h.DB.Preload("Vehicle").Preload("Schedule").Preload("Schedule.Assignments").Preload("Schedule.Assignments.Crew").First(&b,id).Error; err!=nil {
			if err==gorm.ErrRecordNotFound { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
			return c.Status(500).JSON(fiber.Map{"error":"db"})
		}
		return c.JSON(b)
	}
}

func (h *Handler) CreateBooking() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var b models.Booking
		if err:=c.BodyParser(&b); err!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		if b.Status=="" { b.Status = models.BookingPending }
		b.TotalPrice = b.BasePrice + b.ExtraPrice
		if err:=h.DB.Create(&b).Error; err!=nil { return c.Status(500).JSON(fiber.Map{"error":err.Error()}) }
		return c.Status(201).JSON(b)
	}
}

func (h *Handler) UpdateBooking() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id,err := uuid.Parse(c.Params("id"))
		if err!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }
		var b models.Booking
		if err:=h.DB.First(&b,id).Error; err!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
		var data map[string]interface{}
		if err:=c.BodyParser(&data); err!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }
		if bp,ok:=data["base_price"].(float64); ok { b.BasePrice = bp }
		if ep,ok:=data["extra_price"].(float64); ok { b.ExtraPrice = ep }
		b.TotalPrice = b.BasePrice + b.ExtraPrice
		data["total_price"] = b.TotalPrice
		if err:=h.DB.Model(&b).Updates(data).Error; err!=nil { return c.Status(500).JSON(fiber.Map{"error":err.Error()}) }
		h.DB.First(&b,id)
		return c.JSON(b)
	}
}

func (h *Handler) DeleteBooking() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id,err := uuid.Parse(c.Params("id"))
		if err!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }
		r := h.DB.Delete(&models.Booking{},id)
		if r.Error!=nil { return c.Status(500).JSON(fiber.Map{"error":"db"}) }
		if r.RowsAffected==0 { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
		return c.JSON(fiber.Map{"message":"ok"})
	}
}
