package handlers

import (
	"moving-company/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (h *Handler) ListNotifications() fiber.Handler { return func(c *fiber.Ctx) error { page:=c.QueryInt("page",1); ps:=c.QueryInt("page_size",20); uid:=c.Query("user_id"); if uid=="" { uid=c.Get("X-User-ID") }; q:=h.DB.Model(&models.Notification{}); if uid!="" { q=q.Where("user_id=?",uid) }; var d []models.Notification; r,e:=models.Paginate(q.Order("created_at DESC"),page,ps,&d); if e!=nil { return c.Status(500).JSON(fiber.Map{"error":e.Error()}) }; return c.JSON(r) } }

func (h *Handler) MarkNotificationRead() fiber.Handler { return func(c *fiber.Ctx) error { id,e:=uuid.Parse(c.Params("id")); if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad"}) }; var n models.Notification; if e:=h.DB.First(&n,id).Error; e!=nil { return c.Status(404).JSON(fiber.Map{"error":"nf"}) }; now:=time.Now(); n.Read=true; n.ReadAt=&now; if e:=h.DB.Save(&n).Error; e!=nil { return c.Status(500).JSON(fiber.Map{"error":"db"}) }; return c.JSON(n) } }

func (h *Handler) MarkAllRead() fiber.Handler { return func(c *fiber.Ctx) error { uid:=c.Query("user_id"); if uid=="" { uid=c.Get("X-User-ID") }; if uid=="" { return c.Status(400).JSON(fiber.Map{"error":"no uid"}) }; id,e:=uuid.Parse(uid); if e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }; now:=time.Now(); h.DB.Model(&models.Notification{}).Where("user_id=? AND read=?",id,false).Updates(map[string]interface{}{"read":true,"read_at":&now}); return c.JSON(fiber.Map{"message":"ok"}) } }
