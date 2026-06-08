package handler

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"tour-confirmation/model"
	"tour-confirmation/store"
)

type ExportHandler struct {
	store *store.Store
}

func NewExportHandler(s *store.Store) *ExportHandler {
	return &ExportHandler{store: s}
}

type CreateExportReq struct {
	Type          model.ExportType   `json:"type"`
	Format        model.ExportFormat  `json:"format"`
	SourceID      string             `json:"source_id"`
	AttachmentIDs []string           `json:"attachment_ids,omitempty"`
}

func (h *ExportHandler) Create(c *fiber.Ctx) error {
	var req CreateExportReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, err.Error()))
	}
	switch req.Type {
	case model.ExportItinerary:
		if _, ok := h.store.GetItinerary(req.SourceID); !ok {
			return c.Status(404).JSON(model.Fail(model.ErrItineraryNotFound))
		}
	case model.ExportConfirmation:
		if _, ok := h.store.GetConfirmation(req.SourceID); !ok {
			return c.Status(404).JSON(model.Fail(model.ErrConfirmNotFound))
		}
	default:
		return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, "unsupported export type"))
	}
	now := time.Now()
	uid := c.Get("X-User-ID", "anonymous")
	uname := c.Get("X-User-Name", "匿名")
	task := &model.ExportTask{
		ID:              uuid.New().String(),
		Type:            req.Type,
		Format:          req.Format,
		SourceID:        req.SourceID,
		Status:          model.ExportPending,
		AttachmentIDs:   req.AttachmentIDs,
		RequestedBy:     uid,
		RequestedByName: uname,
		CreatedAt:       now,
	}
	h.store.SaveExport(task)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "export",
		EntityID:     task.ID,
		Action:       model.ActionExportCreate,
		OperatorID:   uid,
		OperatorName: uname,
		Detail:       fmt.Sprintf("创建导出任务: %s %s", req.Type, req.Format),
		CreatedAt:    now,
	})
	go h.simulateExport(task)
	return c.Status(201).JSON(model.OK(task))
}

func (h *ExportHandler) simulateExport(task *model.ExportTask) {
	time.Sleep(2 * time.Second)
	now := time.Now()
	task.Status = model.ExportCompleted
	task.CompletedAt = &now
	task.DownloadURL = fmt.Sprintf("/api/v1/exports/%s/download", task.ID)
	h.store.SaveExport(task)
}

func (h *ExportHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	task, ok := h.store.GetExport(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrExportNotFound))
	}
	return c.JSON(model.OK(task))
}

func (h *ExportHandler) Download(c *fiber.Ctx) error {
	id := c.Params("id")
	task, ok := h.store.GetExport(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrExportNotFound))
	}
	if task.Status != model.ExportCompleted {
		return c.Status(409).JSON(model.FailMsg(model.ErrExportFailed, "导出尚未完成"))
	}
	return c.JSON(model.OK(fiber.Map{
		"message":     "模拟下载：实际部署时返回文件流",
		"download_url": task.DownloadURL,
		"format":      task.Format,
	}))
}
