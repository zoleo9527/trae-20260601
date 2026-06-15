package handlers

import (
	"moving-company/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (h *Handler) ListCrews() fiber.Handler { return func(c *fiber.Ctx) error { page:=c.QueryInt("page",1); ps:=c.QueryInt("page_size",20); status:=c.Query("status"); pos:=c.Query("position"); q:=h.DB.Model(&models.CrewMember{}); if status!="" { q=q.Where("status=?",status) }; if pos!="" { q=q.Where("position=?",pos) }; var d []models.CrewMember; r,e:=models.Paginate(q.Order("created_at DESC"),page,ps,&d); if e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }; return c.JSON(r) } }

func (h *Handler) GetCrew() fiber.Handler { return func(c *fiber.Ctx) error { id,e:=uuid.Parse(c.Params("id")); if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }; var v models.CrewMember; if e:=h.DB.First(&v,id).Error; e!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }; return c.JSON(v) } }

func (h *Handler) CreateCrew() fiber.Handler { return func(c *fiber.Ctx) error { var v models.CrewMember; if e:=c.BodyParser(&v); e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }; if v.Status=="" { v.Status=models.CrewActive }; if e:=h.DB.Create(&v).Error; e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }; return c.Status(201).JSON(v) } }

func (h *Handler) UpdateCrew() fiber.Handler { return func(c *fiber.Ctx) error { id,e:=uuid.Parse(c.Params("id")); if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }; var v models.CrewMember; if e:=h.DB.First(&v,id).Error; e!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }; var d map[string]interface{}; if e:=c.BodyParser(&d); e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }; if e:=h.DB.Model(&v).Updates(d).Error; e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }; h.DB.First(&v,id); return c.JSON(v) } }

func (h *Handler) DeleteCrew() fiber.Handler { return func(c *fiber.Ctx) error { id,e:=uuid.Parse(c.Params("id")); if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }; r:=h.DB.Delete(&models.CrewMember{},id); if r.Error!=nil { return c.Status(500).JSON(fiber.Map{"error":"db"}) }; if r.RowsAffected==0 { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }; return c.JSON(fiber.Map{"message":"ok"}) } }
