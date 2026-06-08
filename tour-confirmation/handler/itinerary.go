package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"tour-confirmation/model"
	"tour-confirmation/store"
)

type ItineraryHandler struct {
	store *store.Store
}

func NewItineraryHandler(s *store.Store) *ItineraryHandler {
	return &ItineraryHandler{store: s}
}

type CreateItineraryReq struct {
	TeamName     string              `json:"team_name"`
	TeamCode     string              `json:"team_code"`
	GuideName    string              `json:"guide_name"`
	GuidePhone   string              `json:"guide_phone"`
	Days         int                 `json:"days"`
	StartDate    string              `json:"start_date"`
	EndDate      string              `json:"end_date"`
	RouteSummary string              `json:"route_summary"`
	Items        []model.ItineraryItem `json:"items"`
}

func (h *ItineraryHandler) Create(c *fiber.Ctx) error {
	var req CreateItineraryReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, err.Error()))
	}
	now := time.Now()
	itin := &model.Itinerary{
		ID:           uuid.New().String(),
		TeamName:     req.TeamName,
		TeamCode:     req.TeamCode,
		GuideName:    req.GuideName,
		GuidePhone:   req.GuidePhone,
		Days:         req.Days,
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		RouteSummary: req.RouteSummary,
		Items:        req.Items,
		Status:       model.ItineraryDraft,
		CreatorID:    c.Get("X-User-ID", "anonymous"),
		CreatorName:  c.Get("X-User-Name", "匿名"),
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	h.store.SaveItinerary(itin)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "itinerary",
		EntityID:     itin.ID,
		Action:       model.ActionItinCreate,
		OperatorID:   itin.CreatorID,
		OperatorName: itin.CreatorName,
		Detail:       "创建行程",
		CreatedAt:    now,
	})
	return c.Status(201).JSON(model.OK(itin))
}

type UpdateItineraryReq struct {
	TeamName     *string              `json:"team_name,omitempty"`
	TeamCode     *string              `json:"team_code,omitempty"`
	GuideName    *string              `json:"guide_name,omitempty"`
	GuidePhone   *string              `json:"guide_phone,omitempty"`
	Days         *int                 `json:"days,omitempty"`
	StartDate    *string              `json:"start_date,omitempty"`
	EndDate      *string              `json:"end_date,omitempty"`
	RouteSummary *string              `json:"route_summary,omitempty"`
	Items        *[]model.ItineraryItem `json:"items,omitempty"`
}

func (h *ItineraryHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	itin, ok := h.store.GetItinerary(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrItineraryNotFound))
	}
	if itin.Status != model.ItineraryDraft {
		return c.Status(409).JSON(model.Fail(model.ErrItineraryNotDraft))
	}
	var req UpdateItineraryReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(model.FailMsg(model.ErrBadRequest, err.Error()))
	}
	if req.TeamName != nil {
		itin.TeamName = *req.TeamName
	}
	if req.TeamCode != nil {
		itin.TeamCode = *req.TeamCode
	}
	if req.GuideName != nil {
		itin.GuideName = *req.GuideName
	}
	if req.GuidePhone != nil {
		itin.GuidePhone = *req.GuidePhone
	}
	if req.Days != nil {
		itin.Days = *req.Days
	}
	if req.StartDate != nil {
		itin.StartDate = *req.StartDate
	}
	if req.EndDate != nil {
		itin.EndDate = *req.EndDate
	}
	if req.RouteSummary != nil {
		itin.RouteSummary = *req.RouteSummary
	}
	if req.Items != nil {
		itin.Items = *req.Items
	}
	itin.UpdatedAt = time.Now()
	h.store.SaveItinerary(itin)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "itinerary",
		EntityID:     itin.ID,
		Action:       model.ActionItinUpdate,
		OperatorID:   c.Get("X-User-ID", "anonymous"),
		OperatorName: c.Get("X-User-Name", "匿名"),
		Detail:       "更新行程",
		CreatedAt:    itin.UpdatedAt,
	})
	return c.JSON(model.OK(itin))
}

func (h *ItineraryHandler) Submit(c *fiber.Ctx) error {
	id := c.Params("id")
	itin, ok := h.store.GetItinerary(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrItineraryNotFound))
	}
	if itin.Status != model.ItineraryDraft {
		return c.Status(409).JSON(model.Fail(model.ErrItineraryNotDraft))
	}
	now := time.Now()
	itin.Status = model.ItinerarySubmitted
	itin.UpdatedAt = now
	h.store.SaveItinerary(itin)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "itinerary",
		EntityID:     itin.ID,
		Action:       model.ActionItinSubmit,
		OperatorID:   c.Get("X-User-ID", "anonymous"),
		OperatorName: c.Get("X-User-Name", "匿名"),
		Detail:       "提交行程",
		CreatedAt:    now,
	})
	return c.JSON(model.OK(itin))
}

func (h *ItineraryHandler) Withdraw(c *fiber.Ctx) error {
	id := c.Params("id")
	itin, ok := h.store.GetItinerary(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrItineraryNotFound))
	}
	if itin.Status != model.ItinerarySubmitted {
		return c.Status(409).JSON(model.Fail(model.ErrItineraryNotSubmit))
	}
	now := time.Now()
	itin.Status = model.ItineraryWithdrawn
	itin.UpdatedAt = now
	h.store.SaveItinerary(itin)
	h.store.AppendAudit(model.AuditLog{
		ID:           uuid.New().String(),
		EntityType:   "itinerary",
		EntityID:     itin.ID,
		Action:       model.ActionItinWithdraw,
		OperatorID:   c.Get("X-User-ID", "anonymous"),
		OperatorName: c.Get("X-User-Name", "匿名"),
		Detail:       "撤回行程",
		CreatedAt:    now,
	})
	return c.JSON(model.OK(itin))
}

func (h *ItineraryHandler) buildConfirmationSummary(itineraryID string) (*model.ConfirmationSummary, *model.ConfirmationProgress) {
	allConfs := h.store.ListConfirmationsByItinerary(itineraryID)
	summary := &model.ConfirmationSummary{
		ByResourceType: map[string]*model.ResourceTypeCounts{},
	}
	progress := &model.ConfirmationProgress{
		UnconfirmedList: []model.UnconfirmedResource{},
		ByResourceType:  map[string]*model.ResourceTypeCounts{},
	}
	var latestRejectTime time.Time
	var latestRejectReason string
	var lastRemindedAt time.Time
	for _, cf := range allConfs {
		rt := cf.ResourceType
		if rt == "" {
			rt = "unknown"
		}
		rtCountsSummary, ok := summary.ByResourceType[rt]
		if !ok {
			rtCountsSummary = &model.ResourceTypeCounts{}
			summary.ByResourceType[rt] = rtCountsSummary
		}
		rtCountsProgress, ok := progress.ByResourceType[rt]
		if !ok {
			rtCountsProgress = &model.ResourceTypeCounts{}
			progress.ByResourceType[rt] = rtCountsProgress
		}
		switch cf.Status {
		case model.ConfirmPending:
			summary.PendingCount++
			progress.PendingCount++
			rtCountsSummary.PendingCount++
			rtCountsProgress.PendingCount++
		case model.ConfirmConfirmed:
			summary.ConfirmedCount++
			progress.ConfirmedCount++
			rtCountsSummary.ConfirmedCount++
			rtCountsProgress.ConfirmedCount++
		case model.ConfirmRejected:
			summary.RejectedCount++
			progress.RejectedCount++
			rtCountsSummary.RejectedCount++
			rtCountsProgress.RejectedCount++
		case model.ConfirmRevised:
			summary.RevisedCount++
			progress.RevisedCount++
			rtCountsSummary.RevisedCount++
			rtCountsProgress.RevisedCount++
		}
		summary.TotalCount++
		rtCountsSummary.TotalCount++
		rtCountsProgress.TotalCount++
		if cf.Status == model.ConfirmPending || cf.Status == model.ConfirmRevised {
			progress.UnconfirmedList = append(progress.UnconfirmedList, model.UnconfirmedResource{
				ID:           cf.ID,
				ResourceType: cf.ResourceType,
				ResourceName: cf.ResourceName,
				ResourceRef:  cf.ResourceRef,
				Status:       cf.Status,
			})
		}
		if cf.Status == model.ConfirmRejected {
			logs := h.store.ListAudit("confirmation", cf.ID)
			for i := len(logs) - 1; i >= 0; i-- {
				if logs[i].Action == model.ActionConfirmReject {
					if logs[i].CreatedAt.After(latestRejectTime) {
						latestRejectTime = logs[i].CreatedAt
						latestRejectReason = logs[i].Detail
					}
					break
				}
			}
		}
		logs := h.store.ListAudit("confirmation", cf.ID)
		for i := len(logs) - 1; i >= 0; i-- {
			if logs[i].Action == model.ActionConfirmRemind {
				if logs[i].CreatedAt.After(lastRemindedAt) {
					lastRemindedAt = logs[i].CreatedAt
				}
				break
			}
		}
	}
	progress.LatestRejectReason = latestRejectReason
	if !lastRemindedAt.IsZero() {
		progress.LastRemindedAt = &lastRemindedAt
		summary.LastRemindedAt = &lastRemindedAt
	}
	return summary, progress
}

func (h *ItineraryHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	itin, ok := h.store.GetItinerary(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrItineraryNotFound))
	}
	_, progress := h.buildConfirmationSummary(id)
	return c.JSON(model.OK(fiber.Map{
		"itinerary":            itin,
		"confirmation_progress": progress,
	}))
}

type ItineraryListItem struct {
	Itinerary           *model.Itinerary        `json:"itinerary"`
	ConfirmationSummary *model.ConfirmationSummary `json:"confirmation_summary"`
}

type ListResult struct {
	Items []ItineraryListItem `json:"items"`
	Total int                  `json:"total"`
}

func (h *ItineraryHandler) List(c *fiber.Ctx) error {
	status := model.ItineraryStatus(c.Query("status"))
	var hasPending *bool
	if v := c.Query("has_pending"); v != "" {
		val := v == "true"
		hasPending = &val
	}
	offset := c.QueryInt("offset", 0)
	limit := c.QueryInt("limit", 20)
	if limit > 100 {
		limit = 100
	}
	itins, total := h.store.ListItineraries(status, hasPending, offset, limit)
	items := make([]ItineraryListItem, 0, len(itins))
	for _, it := range itins {
		summary, _ := h.buildConfirmationSummary(it.ID)
		items = append(items, ItineraryListItem{
			Itinerary:           it,
			ConfirmationSummary: summary,
		})
	}
	return c.JSON(model.OK(ListResult{Items: items, Total: total}))
}

type RemindReq struct {
	Remark string `json:"remark,omitempty"`
}

type RemindResult struct {
	RemindedIDs []string  `json:"reminded_ids"`
	RemindedAt  time.Time `json:"reminded_at"`
}

func (h *ItineraryHandler) Remind(c *fiber.Ctx) error {
	id := c.Params("id")
	_, ok := h.store.GetItinerary(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrItineraryRemind))
	}
	var req RemindReq
	_ = c.BodyParser(&req)
	now := time.Now()
	uid := c.Get("X-User-ID", "anonymous")
	uname := c.Get("X-User-Name", "匿名")
	allConfs := h.store.ListConfirmationsByItinerary(id)
	var remindedIDs []string
	for _, cf := range allConfs {
		if cf.Status != model.ConfirmPending && cf.Status != model.ConfirmRevised {
			continue
		}
		detail := "催办确认"
		if req.Remark != "" {
			detail += ": " + req.Remark
		}
		h.store.AppendAudit(model.AuditLog{
			ID:           uuid.New().String(),
			EntityType:   "confirmation",
			EntityID:     cf.ID,
			Action:       model.ActionConfirmRemind,
			OperatorID:   uid,
			OperatorName: uname,
			Detail:       detail,
			CreatedAt:    now,
		})
		remindedIDs = append(remindedIDs, cf.ID)
	}
	if remindedIDs == nil {
		remindedIDs = []string{}
	}
	return c.JSON(model.OK(RemindResult{
		RemindedIDs: remindedIDs,
		RemindedAt:  now,
	}))
}

func (h *ItineraryHandler) AuditHistory(c *fiber.Ctx) error {
	id := c.Params("id")
	_, ok := h.store.GetItinerary(id)
	if !ok {
		return c.Status(404).JSON(model.Fail(model.ErrItineraryNotFound))
	}
	logs := h.store.ListAudit("itinerary", id)
	return c.JSON(model.OK(logs))
}
