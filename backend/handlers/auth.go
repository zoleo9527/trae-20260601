package handlers

import (
	"moving-company/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (h *Handler) Login() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req LoginReq
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
		}
		if req.Username == "" || req.Password == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "empty"})
		}
		var user models.User
		if err := h.DB.Where("username = ? AND password = ?", req.Username, req.Password).First(&user).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid"})
			}
			return c.Status(500).JSON(fiber.Map{"error": "db"})
		}
		return c.JSON(user)
	}
}

func (h *Handler) GetCurrentUser() fiber.Handler {
	return func(c *fiber.Ctx) error {
		uid := c.Get("X-User-ID")
		if uid == "" { return c.Status(401).JSON(fiber.Map{"error":"no user"}) }
		id, err := uuid.Parse(uid)
		if err != nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }
		var user models.User
		if err := h.DB.First(&user, id).Error; err != nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }
		return c.JSON(user)
	}
}

func (h *Handler) ListUsers() fiber.Handler {
	return func(c *fiber.Ctx) error {
		page := c.QueryInt("page", 1)
		ps := c.QueryInt("page_size", 20)
		role := c.Query("role")
		q := h.DB.Model(&models.User{})
		if role != "" { q = q.Where("role = ?", role) }
		var users []models.User
		res, err := models.Paginate(q.Order("created_at DESC"), page, ps, &users)
		if err != nil { return c.Status(500).JSON(fiber.Map{"error": err.Error()}) }
		return c.JSON(res)
	}
}
