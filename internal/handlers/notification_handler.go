package handlers

import (
	"scenic-ticket-system/internal/models"
	"scenic-ticket-system/internal/store"

	"github.com/gofiber/fiber/v2"
)

type NotificationHandler struct {
	store *store.Store
}

func NewNotificationHandler(s *store.Store) *NotificationHandler {
	return &NotificationHandler{store: s}
}

func (h *NotificationHandler) ListNotifications(c *fiber.Ctx) error {
	role := c.Query("role")
	user := c.Query("user")

	if role != "" {
		notifications := h.store.ListNotificationsByRole(models.Role(role))
		return c.JSON(notifications)
	}
	if user != "" {
		notifications := h.store.ListNotificationsByUser(user)
		return c.JSON(notifications)
	}

	notifications := h.store.ListAllNotifications()
	return c.JSON(notifications)
}

func (h *NotificationHandler) MarkRead(c *fiber.Ctx) error {
	id := c.Params("id")

	ok := h.store.MarkNotificationRead(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "notification not found"})
	}

	return c.JSON(fiber.Map{"message": "marked as read"})
}
