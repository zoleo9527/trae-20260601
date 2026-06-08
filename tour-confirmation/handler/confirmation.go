package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"tour-confirmation/model"
	"tour-confirmation/store"
)

type ConfirmationHandler struct {
	store *store.Store
}

func NewConfirmationHandler(s *store.Store) *ConfirmationHandler {
	return &ConfirmationHandler{store: s}
}

type CreateConfirmationReq struct {
	ItineraryID string `json:"itinerary_id"`
	ResourceType string `json:"resource_type"`
	ResourceName string `json:"resource_name"`
	ResourceRef  string `json:"resource_ref"`
}

func (h *ConfirmationHandler) Create(c *fiber.Ctx) error {
	var req CreateConfirmationReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, err.Error()))
	}
	itin, ok := h.store.GetItineraryByIDForSummary(req.ItineraryID)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrItineraryNotFound))
	}
	now := time.Now()
	uid := c.Get("X-User-ID", "anonymous")
	uname := c.Get("X-User-Name", "匿名")
	summary := &model.ItinerarySummary{
		TeamName:     itin.TeamName,
		TeamCode:     itin.TeamCode,
		StartDate:    itin.StartDate,
		EndDate:      itin.EndDate,
		RouteSummary: itin.RouteSummary,
	}
	var prevConfirmations []*model.ResourceConfirmation
	allConfs, _ := h.store.ListConfirmations(req.ItineraryID, "", "", nil, nil, 0, 1000)
	prevConfirmations = allConfs
	var prevConclusion string
	for _, pc := range prevConfirmations {
		if pc.Status == model.ConfirmConfirmed || pc.Status == model.ConfirmRejected {
			prevConclusion += pc.ResourceName + ": " + string(pc.Status)
			if pc.PrevConclusion != "" {
				prevConclusion += "（来自: " + pc.PrevConclusion + "）"
			}
			prevConclusion += "; "
		}
	}
	cf := &model.ResourceConfirmation{
		ID:               uuid.New().String(),
		ItineraryID:      req.ItineraryID,
		ItinerarySummary: summary,
		ResourceType:     req.ResourceType,
		ResourceName:     req.ResourceName,
		ResourceRef:      req.ResourceRef,
		Materials:        []model.ConfirmationMaterial{},
		Notes:            []model.ConfirmationNote{},
		PrevConclusion:   prevConclusion,
		Status:           model.ConfirmPending,
		HandlerID:        uid,
		HandlerName:       uname,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	h.store.SaveConfirmation(cf)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "confirmation",
		EntityID:     cf.ID,
		Action:       model.ActionConfirmCreate,
		OperatorID:   uid,
		OperatorName: uname,
		Detail:       "创建资源确认: " + req.ResourceName,
		CreatedAt:    now,
	})
	return c.Status(201).JSON(model.OK(cf))
}

func (h *ConfirmationHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	cf, ok := h.store.GetConfirmation(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrConfirmNotFound))
	}
	if cf.ItinerarySummary == nil {
		itin, ok := h.store.GetItineraryByIDForSummary(cf.ItineraryID)
		if ok {
			cf.ItinerarySummary = &model.ItinerarySummary{
				TeamName:     itin.TeamName,
				TeamCode:     itin.TeamCode,
				StartDate:    itin.StartDate,
				EndDate:      itin.EndDate,
				RouteSummary: itin.RouteSummary,
			}
		}
	}
	return c.JSON(model.OK(cf))
}

type ConfirmListResult struct {
	Items []*model.ResourceConfirmation `json:"items"`
	Total int                           `json:"total"`
}

func (h *ConfirmationHandler) List(c *fiber.Ctx) error {
	itinID := c.Query("itinerary_id")
	status := model.ConfirmationStatus(c.Query("status"))
	resourceType := c.Query("resource_type")
	var createdFrom, createdTo *time.Time
	if v := c.Query("created_from"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, "created_from 格式错误，需 RFC3339"))
		}
		createdFrom = &t
	}
	if v := c.Query("created_to"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, "created_to 格式错误，需 RFC3339"))
		}
		createdTo = &t
	}
	offset := c.QueryInt("offset", 0)
	limit := c.QueryInt("limit", 20)
	if limit > 100 {
		limit = 100
	}
	items, total := h.store.ListConfirmations(itinID, status, resourceType, createdFrom, createdTo, offset, limit)
	return c.JSON(model.OK(ConfirmListResult{Items: items, Total: total}))
}

type ConfirmActionReq struct {
	Remark string `json:"remark,omitempty"`
}

func (h *ConfirmationHandler) Confirm(c *fiber.Ctx) error {
	id := c.Params("id")
	cf, ok := h.store.GetConfirmation(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrConfirmNotFound))
	}
	if cf.Status != model.ConfirmPending && cf.Status != model.ConfirmRevised {
		return c.Status(409).JSON(model.Fail(model.ErrConfirmNotPending))
	}
	now := time.Now()
	uid := c.Get("X-User-ID", "anonymous")
	uname := c.Get("X-User-Name", "匿名")
	cf.Status = model.ConfirmConfirmed
	cf.UpdatedAt = now
	h.store.SaveConfirmation(cf)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "confirmation",
		EntityID:     cf.ID,
		Action:       model.ActionConfirmConfirm,
		OperatorID:   uid,
		OperatorName: uname,
		Detail:       "确认通过",
		CreatedAt:    now,
	})
	return c.JSON(model.OK(cf))
}

type RejectReq struct {
	Reason string `json:"reason"`
}

func (h *ConfirmationHandler) Reject(c *fiber.Ctx) error {
	id := c.Params("id")
	cf, ok := h.store.GetConfirmation(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrConfirmNotFound))
	}
	if cf.Status != model.ConfirmPending && cf.Status != model.ConfirmRevised {
		return c.Status(409).JSON(model.Fail(model.ErrConfirmNotPending))
	}
	var req RejectReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, err.Error()))
	}
	now := time.Now()
	uid := c.Get("X-User-ID", "anonymous")
	uname := c.Get("X-User-Name", "匿名")
	cf.Status = model.ConfirmRejected
	cf.UpdatedAt = now
	h.store.SaveConfirmation(cf)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "confirmation",
		EntityID:     cf.ID,
		Action:       model.ActionConfirmReject,
		OperatorID:   uid,
		OperatorName: uname,
		Detail:       "确认驳回: " + req.Reason,
		CreatedAt:    now,
	})
	return c.JSON(model.OK(cf))
}

func (h *ConfirmationHandler) Revise(c *fiber.Ctx) error {
	id := c.Params("id")
	cf, ok := h.store.GetConfirmation(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrConfirmNotFound))
	}
	if cf.Status != model.ConfirmRejected {
		return c.Status(409).JSON(model.Fail(model.ErrConfirmNotPending))
	}
	now := time.Now()
	uid := c.Get("X-User-ID", "anonymous")
	uname := c.Get("X-User-Name", "匿名")
	cf.Status = model.ConfirmRevised
	cf.UpdatedAt = now
	h.store.SaveConfirmation(cf)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "confirmation",
		EntityID:     cf.ID,
		Action:       model.ActionConfirmRevise,
		OperatorID:   uid,
		OperatorName: uname,
		Detail:       "修订后重新提交",
		CreatedAt:    now,
	})
	return c.JSON(model.OK(cf))
}

type AddMaterialReq struct {
	Category    string                      `json:"category"`
	Title       string                      `json:"title"`
	Description string                      `json:"description"`
	Attachments []model.ConfirmationAttachment `json:"attachments,omitempty"`
}

func (h *ConfirmationHandler) AddMaterial(c *fiber.Ctx) error {
	id := c.Params("id")
	cf, ok := h.store.GetConfirmation(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrConfirmNotFound))
	}
	var req AddMaterialReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, err.Error()))
	}
	now := time.Now()
	uid := c.Get("X-User-ID", "anonymous")
	uname := c.Get("X-User-Name", "匿名")
	mat := model.ConfirmationMaterial{
		Category:    req.Category,
		Title:       req.Title,
		Description: req.Description,
		Attachments: req.Attachments,
	}
	cf.Materials = append(cf.Materials, mat)
	cf.UpdatedAt = now
	h.store.SaveConfirmation(cf)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "confirmation",
		EntityID:     cf.ID,
		Action:       model.ActionConfirmMaterial,
		OperatorID:   uid,
		OperatorName: uname,
		Detail:       "补充材料: " + req.Title,
		CreatedAt:    now,
	})
	return c.JSON(model.OK(cf))
}

type AddNoteReq struct {
	Content string `json:"content"`
}

func (h *ConfirmationHandler) AddNote(c *fiber.Ctx) error {
	id := c.Params("id")
	cf, ok := h.store.GetConfirmation(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrConfirmNotFound))
	}
	var req AddNoteReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, err.Error()))
	}
	now := time.Now()
	uid := c.Get("X-User-ID", "anonymous")
	uname := c.Get("X-User-Name", "匿名")
	note := model.ConfirmationNote{
		ID:         uuid.New().String(),
		AuthorID:   uid,
		AuthorName: uname,
		Content:    req.Content,
		CreatedAt:  now,
	}
	cf.Notes = append(cf.Notes, note)
	cf.UpdatedAt = now
	h.store.SaveConfirmation(cf)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "confirmation",
		EntityID:     cf.ID,
		Action:       model.ActionConfirmNote,
		OperatorID:   uid,
		OperatorName: uname,
		Detail:       "添加备注",
		CreatedAt:    now,
	})
	return c.JSON(model.OK(cf))
}

func (h *ConfirmationHandler) AuditHistory(c *fiber.Ctx) error {
	id := c.Params("id")
	_, ok := h.store.GetConfirmation(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrConfirmNotFound))
	}
	logs := h.store.ListAudit("confirmation", id)
	return c.JSON(model.OK(logs))
}
