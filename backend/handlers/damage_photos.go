package handlers

import (
	"moving-company/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (h *Handler) ListDamagePhotos() fiber.Handler { return func(c *fiber.Ctx) error { page:=c.QueryInt("page",1); ps:=c.QueryInt("page_size",20); bid:=c.Query("booking_id"); eid:=c.Query("exception_id"); q:=h.DB.Model(&models.DamagePhoto{}); if bid!="" { q=q.Where("booking_id=?",bid) }; if eid!="" { q=q.Where("exception_id=?",eid) }; var d []models.DamagePhoto; r,e:=models.Paginate(q.Order("created_at DESC"),page,ps,&d); if e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }; return c.JSON(r) } }

func (h *Handler) CreateDamagePhoto() fiber.Handler { return func(c *fiber.Ctx) error { var v models.DamagePhoto; if e:=c.BodyParser(&v); e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }; if e:=h.DB.Create(&v).Error; e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }; return c.Status(201).JSON(v) } }

func (h *Handler) DeleteDamagePhoto() fiber.Handler { return func(c *fiber.Ctx) error { id,e:=uuid.Parse(c.Params("id")); if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }; r:=h.DB.Delete(&models.DamagePhoto{},id); if r.Error!=nil { return c.Status(500).JSON(fiber.Map{"error":"db"}) }; if r.RowsAffected==0 { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }; return c.JSON(fiber.Map{"message":"ok"}) } }
