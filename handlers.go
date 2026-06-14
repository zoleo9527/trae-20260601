package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ----------------- 公共工具 -----------------

type Resp struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data,omitempty"`
}

func ok(c *fiber.Ctx, data interface{}) error {
	return c.JSON(Resp{Code: 0, Msg: "ok", Data: data})
}

func fail(c *fiber.Ctx, status int, msg string) error {
	return c.Status(status).JSON(Resp{Code: status, Msg: msg})
}

func userByAccount(account string) (*User, error) {
	var u User
	err := DB.Where("account = ?", account).First(&u).Error
	return &u, err
}

func recordDetail(id uint) (*AppraisalRecord, error) {
	var r AppraisalRecord
	err := DB.Preload("Schedules.AssignedExpert").
		Preload("Schedules.Creator").
		Preload("SupplementNotices.Issuer").
		Preload("SupplementNotices.Replenisher").
		Preload("StatusLogs.Operator").
		Preload("CommentLogs.Operator").
		Preload("AcceptClerk").
		Preload("Expert").
		Preload("QC").
		First(&r, id).Error
	return &r, err
}

func buildResponsibilitySummary(r *AppraisalRecord) ResponsibilitySummary {
	rule := GetResponsibilityRule(r.Status)
	summary := ResponsibilitySummary{}

	if rule != nil {
		summary.CurrentResponsibleRole = string(rule.ResponsibleRole)
		summary.CurrentResponsibleRoleText = rule.ResponsibleRoleText
		summary.NextAction = rule.NextAction
	}

	switch rule.ResponsibleRole {
	case RoleClerk:
		if r.AcceptClerk != nil {
			summary.CurrentResponsibleName = r.AcceptClerk.Name
		}
	case RoleExpert:
		if r.Expert != nil {
			summary.CurrentResponsibleName = r.Expert.Name
		}
	case RoleQC:
		if r.QC != nil {
			summary.CurrentResponsibleName = r.QC.Name
		}
	}

	var lastRejectLog StatusLog
	DB.Where("record_id = ? AND to_status IN ?", r.ID, []CaseStatus{StatusRejectedQC, StatusNeedSupplement}).
		Order("id DESC").
		Preload("Operator").
		First(&lastRejectLog)
	if lastRejectLog.ID > 0 {
		summary.LatestRejectAt = lastRejectLog.CreatedAt.Format("2006-01-02 15:04")
		if lastRejectLog.Operator != nil {
			summary.LatestRejectOperator = fmt.Sprintf("%s(%s)", lastRejectLog.Operator.Name, roleText(lastRejectLog.Operator.Role))
		}
		switch lastRejectLog.ToStatus {
		case StatusNeedSupplement:
			var notice SupplementNotice
			DB.Where("record_id = ? AND notice_no = ?", r.ID, strings.TrimPrefix(lastRejectLog.Reason, "发起补样通知:")).
				First(&notice)
			if notice.ID > 0 {
				parts := []string{}
				if strings.TrimSpace(notice.MissingItems) != "" {
					parts = append(parts, "缺项："+notice.MissingItems)
				}
				if strings.TrimSpace(notice.ExpertComment) != "" {
					parts = append(parts, "鉴定人说明："+notice.ExpertComment)
				}
				summary.LatestRejectReason = strings.Join(parts, "；")
			} else {
				summary.LatestRejectReason = strings.TrimSpace(r.RejectReason)
			}
		case StatusRejectedQC:
			reason := strings.TrimSpace(r.RejectReason)
			if reason == "" {
				reason = strings.TrimSpace(lastRejectLog.Reason)
			}
			if reason == "" || reason == fmt.Sprintf("%s→%s", lastRejectLog.FromStatus, StatusRejectedQC) {
				reason = "质控退回（未填写具体原因）"
			}
			summary.LatestRejectReason = reason
		}
	} else if strings.TrimSpace(r.RejectReason) != "" {
		summary.LatestRejectReason = strings.TrimSpace(r.RejectReason)
	}

	var latestNotice SupplementNotice
	DB.Where("record_id = ?", r.ID).Order("id DESC").Preload("Issuer").First(&latestNotice)
	if latestNotice.ID > 0 {
		summary.LatestSupplementNoticeNo = latestNotice.NoticeNo
		summary.LatestSupplementDeadline = latestNotice.Deadline
		summary.LatestSupplementStatus = latestNotice.Status
		items := strings.Split(strings.TrimSpace(latestNotice.MissingItems), "\n")
		shortItems := items
		if len(items) > 2 {
			shortItems = items[:2]
		}
		issuerName := ""
		if latestNotice.Issuer != nil {
			issuerName = latestNotice.Issuer.Name
		}
		summary.LatestSupplementSummary = fmt.Sprintf("%s 发起，缺%s项：%s",
			issuerName,
			ifElse(len(items) > 2, fmt.Sprintf("%d", len(items)), fmt.Sprintf("%d", len(shortItems))),
			strings.Join(shortItems, "；"))

		switch latestNotice.Status {
		case "supplied":
			summary.SupplementStatusText = "已补样待重排"
		default:
			if latestNotice.Deadline != "" {
				deadlineTime, err := time.Parse("2006-01-02", latestNotice.Deadline)
				if err == nil {
					now := time.Now()
					deadlineEnd := time.Date(deadlineTime.Year(), deadlineTime.Month(), deadlineTime.Day(), 23, 59, 59, 0, deadlineTime.Location())
					remaining := int(deadlineEnd.Sub(now).Hours() / 24)
					summary.SupplementRemainingDays = &remaining
					if remaining < 0 {
						summary.SupplementIsOverdue = true
						summary.SupplementStatusText = fmt.Sprintf("已超期%d天", -remaining)
					} else if remaining == 0 {
						summary.SupplementStatusText = "今日到期"
					} else if remaining <= 3 {
						summary.SupplementStatusText = fmt.Sprintf("待补样（剩余%d天）", remaining)
					} else {
						summary.SupplementStatusText = fmt.Sprintf("待补样（剩余%d天）", remaining)
					}
				} else {
					summary.SupplementStatusText = "待补样"
				}
			} else {
				summary.SupplementStatusText = "待补样"
			}
		}
	}

	return summary
}

func roleText(r Role) string {
	m := map[Role]string{
		RoleClerk:  "受理员",
		RoleExpert: "鉴定人",
		RoleQC:     "质控",
	}
	if v, ok := m[r]; ok {
		return v
	}
	return string(r)
}

// ----------------- 1. 按角色待办列表 -----------------

type TodoItem struct {
	RecordID   uint       `json:"record_id"`
	CaseNo     string     `json:"case_no"`
	EntrustItem string    `json:"entrust_item"`
	ClientName string     `json:"client_name"`
	Status     CaseStatus `json:"status"`
	StatusText string     `json:"status_text"`
	TodoHint   string     `json:"todo_hint"`
	CurrentComment string `json:"current_comment"`
	CarryComment string  `json:"carry_comment"`
	UpdatedAt  time.Time  `json:"updated_at"`
	Responsibility ResponsibilitySummary `json:"responsibility"`
}

func statusText(s CaseStatus) string {
	m := map[CaseStatus]string{
		StatusPendingAccept:  "待受理排期",
		StatusScheduled:      "已排期待鉴定",
		StatusInProgress:     "鉴定中",
		StatusNeedSupplement: "需补样",
		StatusSupplied:       "已补样待重排",
		StatusPendingQC:      "待质控审核",
		StatusArchived:       "已归档",
		StatusRejectedQC:     "质控退回",
	}
	if v, ok := m[s]; ok {
		return v
	}
	return string(s)
}

// GET /api/todo?role=clerk|expert|qc
func GetTodoList(c *fiber.Ctx) error {
	role := Role(c.Query("role", "clerk"))

	var matchStatuses []CaseStatus
	var hintMap = map[CaseStatus]string{}
	for _, r := range TodoRules {
		for _, rr := range r.Roles {
			if rr == role {
				matchStatuses = append(matchStatuses, r.Status)
				hintMap[r.Status] = r.Hint
			}
		}
	}
	if len(matchStatuses) == 0 {
		return ok(c, []TodoItem{})
	}

	var records []AppraisalRecord
	err := DB.Preload("AcceptClerk").
		Preload("Expert").
		Preload("QC").
		Preload("SupplementNotices.Issuer").
		Preload("StatusLogs.Operator").
		Where("status IN ?", matchStatuses).
		Order("updated_at DESC").
		Find(&records).Error
	if err != nil {
		return fail(c, 500, err.Error())
	}

	out := make([]TodoItem, 0, len(records))
	for _, r := range records {
		resp := buildResponsibilitySummary(&r)
		out = append(out, TodoItem{
			RecordID:       r.ID,
			CaseNo:         r.CaseNo,
			EntrustItem:    r.EntrustItem,
			ClientName:     r.ClientName,
			Status:         r.Status,
			StatusText:     statusText(r.Status),
			TodoHint:       hintMap[r.Status],
			CurrentComment: r.CurrentComment,
			CarryComment:   collectCarryComment(r.ID),
			UpdatedAt:      r.UpdatedAt,
			Responsibility: resp,
		})
	}
	return ok(c, fiber.Map{
		"role":         role,
		"match_count":  len(out),
		"match_status": matchStatuses,
		"todos":        out,
	})
}

func collectCarryComment(recordID uint) string {
	var logs []CommentLog
	DB.Where("record_id = ? AND carry_to_next = ?", recordID, true).
		Order("created_at ASC").Find(&logs)
	var parts []string
	for _, l := range logs {
		parts = append(parts, fmt.Sprintf("[%s]%s", l.FromStep, l.Content))
	}
	return strings.Join(parts, " | ")
}

// ----------------- 2. 鉴定排期处理（受理员） -----------------

type ScheduleReq struct {
	RecordID         uint   `json:"record_id" validate:"required"`
	ScheduleDate     string `json:"schedule_date" validate:"required"`
	ScheduleRemark   string `json:"schedule_remark"`
	AssignedExpertID uint   `json:"assigned_expert_id" validate:"required"`
	OperatorAccount  string `json:"operator_account" validate:"required"`
	IsReSchedule     bool   `json:"is_re_schedule"`
}

// POST /api/schedule 受理排期 or 补样后重排期
func HandleSchedule(c *fiber.Ctx) error {
	var req ScheduleReq
	if err := c.BodyParser(&req); err != nil {
		return fail(c, 400, err.Error())
	}
	op, err := userByAccount(req.OperatorAccount)
	if err != nil || op.Role != RoleClerk {
		return fail(c, 403, "仅受理员可操作排期")
	}
	var rec AppraisalRecord
	if err := DB.First(&rec, req.RecordID).Error; err != nil {
		return fail(c, 404, "记录不存在")
	}
	if rec.Status != StatusPendingAccept && rec.Status != StatusSupplied {
		return fail(c, 400, fmt.Sprintf("当前状态%s不允许排期", rec.Status))
	}

	sch := ScheduleRecord{
		RecordID:         rec.ID,
		ScheduleDate:     req.ScheduleDate,
		ScheduleRemark:   req.ScheduleRemark,
		AssignedExpertID: &req.AssignedExpertID,
		IsReSchedule:     req.IsReSchedule,
		CreatedBy:        op.ID,
	}
	DB.Create(&sch)

	if strings.TrimSpace(req.ScheduleRemark) != "" {
		addComment(DB, rec.ID, "schedule", req.ScheduleRemark, true, op.ID)
	}

	from := rec.Status
	updates := map[string]interface{}{
		"Status":         StatusScheduled,
		"AcceptClerkID":  op.ID,
		"ExpertID":       req.AssignedExpertID,
		"CurrentComment": req.ScheduleRemark,
	}
	if rec.RejectReason != "" && req.IsReSchedule {
		updates["RejectReason"] = ""
	}
	DB.Model(&rec).Updates(updates)
	addStatusLog(DB, rec.ID, from, StatusScheduled, "受理排期", op.ID)

	detail, _ := recordDetail(rec.ID)
	return ok(c, fiber.Map{
		"action":   ifElse(req.IsReSchedule, "补样后重排期", "首次排期"),
		"schedule": sch,
		"detail":   detail,
	})
}

// ----------------- 3. 状态变更 -----------------

type StatusChangeReq struct {
	RecordID        uint   `json:"record_id" validate:"required"`
	TargetStatus    string `json:"target_status" validate:"required"`
	Reason          string `json:"reason"`
	Comment         string `json:"comment"`
	CarryComment    *bool  `json:"carry_comment"`
	OpinionDraft    string `json:"opinion_draft"`
	RejectReason    string `json:"reject_reason"`
	OperatorAccount string `json:"operator_account" validate:"required"`
}

// POST /api/status 鉴定开始/提交质控 / 质控通过-归档 / 质控退回
func HandleStatusChange(c *fiber.Ctx) error {
	var req StatusChangeReq
	if err := c.BodyParser(&req); err != nil {
		return fail(c, 400, err.Error())
	}
	op, err := userByAccount(req.OperatorAccount)
	if err != nil {
		return fail(c, 403, "操作人不存在")
	}
	carry := true
	if req.CarryComment != nil {
		carry = *req.CarryComment
	}

	var rec AppraisalRecord
	if err := DB.First(&rec, req.RecordID).Error; err != nil {
		return fail(c, 404, "记录不存在")
	}

	target := CaseStatus(req.TargetStatus)
	from := rec.Status

	// --- 权限校验 & 规则 ---
	var stepKey = "expert"
	switch target {
	case StatusInProgress:
		if op.Role != RoleExpert || rec.Status != StatusScheduled {
			return fail(c, 400, "鉴定人从'已排期'状态开始鉴定")
		}
	case StatusPendingQC:
		if op.Role != RoleExpert || (rec.Status != StatusInProgress && rec.Status != StatusRejectedQC) {
			return fail(c, 400, "鉴定人从'鉴定中'或'质控退回'状态提交质控")
		}
		if strings.TrimSpace(req.OpinionDraft) == "" {
			return fail(c, 400, "提交质控必须填写鉴定意见书草稿")
		}
	case StatusArchived:
		if op.Role != RoleQC || rec.Status != StatusPendingQC {
			return fail(c, 400, "质控从'待质控'状态归档")
		}
		stepKey = "qc"
	case StatusRejectedQC:
		if op.Role != RoleQC || rec.Status != StatusPendingQC {
			return fail(c, 400, "质控从'待质控'状态退回")
		}
		if strings.TrimSpace(req.RejectReason) == "" {
			return fail(c, 400, "质控退回必须填写退回原因")
		}
		stepKey = "qc"
	default:
		return fail(c, 400, "不支持的目标状态："+req.TargetStatus+"（补样请走 /api/supplement/issue）")
	}

	// --- 变更主记录 ---
	updates := map[string]interface{}{
		"Status": target,
	}
	if target == StatusPendingQC {
		updates["OpinionDraft"] = req.OpinionDraft
	}
	if target == StatusRejectedQC {
		updates["RejectReason"] = req.RejectReason
	}
	if target == StatusArchived {
		archiveNo := fmt.Sprintf("GD-%s", rec.CaseNo)
		today := time.Now().Format("2006-01-02")
		updates["ArchiveNo"] = archiveNo
		updates["ArchiveDate"] = &today
		updates["OpinionFinal"] = rec.OpinionDraft
		updates["QcID"] = op.ID
		updates["CurrentComment"] = "已归档，卷宗完整"
	}
	if strings.TrimSpace(req.Comment) != "" && target != StatusArchived {
		updates["CurrentComment"] = req.Comment
	}
	DB.Model(&rec).Updates(updates)

	// --- 日志 ---
	if strings.TrimSpace(req.Comment) != "" {
		addComment(DB, rec.ID, stepKey, req.Comment, carry, op.ID)
	}
	logReason := req.Reason
	if logReason == "" {
		logReason = fmt.Sprintf("%s→%s", from, target)
	}
	addStatusLog(DB, rec.ID, from, target, logReason, op.ID)

	detail, _ := recordDetail(rec.ID)
	return ok(c, fiber.Map{
		"action":       "状态变更",
		"from":         from,
		"to":           target,
		"operator":     op.Name,
		"operator_role": op.Role,
		"detail":       detail,
	})
}

// ----------------- 4. 补样通知（关键：承接排期备注） -----------------

type IssueSupplementReq struct {
	RecordID        uint   `json:"record_id" validate:"required"`
	MissingItems    string `json:"missing_items" validate:"required"`
	Deadline        string `json:"deadline"`
	ExpertComment   string `json:"expert_comment"`
	OperatorAccount string `json:"operator_account" validate:"required"`
}

// POST /api/supplement/issue 鉴定人发起补样通知
func IssueSupplement(c *fiber.Ctx) error {
	var req IssueSupplementReq
	if err := c.BodyParser(&req); err != nil {
		return fail(c, 400, err.Error())
	}
	op, err := userByAccount(req.OperatorAccount)
	if err != nil || op.Role != RoleExpert {
		return fail(c, 403, "仅鉴定人可发起补样通知")
	}
	var rec AppraisalRecord
	if err := DB.First(&rec, req.RecordID).Error; err != nil {
		return fail(c, 404, "记录不存在")
	}
	if rec.Status != StatusInProgress {
		return fail(c, 400, "仅'鉴定中'状态可发起补样，当前："+string(rec.Status))
	}

	// 承接上一步（排期）的备注 —— 核心需求
	var carryRemark string
	var lastSch ScheduleRecord
	DB.Where("record_id = ?", rec.ID).Order("id DESC").First(&lastSch)
	if lastSch.ID > 0 {
		carryRemark = lastSch.ScheduleRemark
	}
	if carryRemark == "" {
		carryRemark = rec.CurrentComment
	}

	noticeNo := fmt.Sprintf("BY-%s-%02d", rec.CaseNo, countNotices(rec.ID)+1)
	today := time.Now().Format("2006-01-02")
	if req.Deadline == "" {
		req.Deadline = time.Now().AddDate(0, 0, 7).Format("2006-01-02")
	}

	notice := SupplementNotice{
		RecordID:      rec.ID,
		NoticeNo:      noticeNo,
		IssueDate:     today,
		Deadline:      req.Deadline,
		MissingItems:  req.MissingItems,
		CarryOnRemark: carryRemark,
		ExpertComment: req.ExpertComment,
		IssuedBy:      op.ID,
		Status:       "pending",
	}
	DB.Create(&notice)

	commentText := req.ExpertComment
	if commentText == "" {
		commentText = "发起补样通知：" + req.MissingItems
	}
	addComment(DB, rec.ID, "supplement", commentText, true, op.ID)

	rejectReason := req.ExpertComment
	if rejectReason == "" {
		rejectReason = "鉴定中发现材料/样本不足"
	}
	from := rec.Status
	DB.Model(&rec).Updates(map[string]interface{}{
		"Status":         StatusNeedSupplement,
		"RejectReason":   rejectReason,
		"CurrentComment": "[承接排期]" + carryRemark + " [鉴定补样说明]" + commentText,
	})
	addStatusLog(DB, rec.ID, from, StatusNeedSupplement, "发起补样通知:"+noticeNo, op.ID)

	detail, _ := recordDetail(rec.ID)
	return ok(c, fiber.Map{
		"action":             "发起补样通知",
		"notice_no":          noticeNo,
		"carry_on_remark":    carryRemark,
		"notice":             notice,
		"detail":             detail,
	})
}

type CompleteSupplementReq struct {
	NoticeID        uint   `json:"notice_id" validate:"required"`
	ReplenishRemark string `json:"replenish_remark"`
	OperatorAccount string `json:"operator_account" validate:"required"`
}

// POST /api/supplement/complete 受理员完成补样
func CompleteSupplement(c *fiber.Ctx) error {
	var req CompleteSupplementReq
	if err := c.BodyParser(&req); err != nil {
		return fail(c, 400, err.Error())
	}
	op, err := userByAccount(req.OperatorAccount)
	if err != nil || op.Role != RoleClerk {
		return fail(c, 403, "仅受理员可处理补样回执")
	}
	var notice SupplementNotice
	if err := DB.First(&notice, req.NoticeID).Error; err != nil {
		return fail(c, 404, "补样通知不存在")
	}
	if notice.Status != "pending" {
		return fail(c, 400, "补样通知已处理，状态："+notice.Status)
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	DB.Model(&notice).Updates(map[string]interface{}{
		"Status":           "supplied",
		"ReplenishRemark":  req.ReplenishRemark,
		"ReplenishedBy":    op.ID,
		"ReplenishedAt":    &now,
	})

	var rec AppraisalRecord
	DB.First(&rec, notice.RecordID)
	from := rec.Status
	newComment := fmt.Sprintf("[补样完成]%s | 原承接备注仍在：%s",
		ifElse(req.ReplenishRemark == "", "材料已补齐", req.ReplenishRemark),
		notice.CarryOnRemark)
	DB.Model(&rec).Updates(map[string]interface{}{
		"Status":         StatusSupplied,
		"CurrentComment": newComment,
	})
	addComment(DB, rec.ID, "supplement", req.ReplenishRemark, true, op.ID)
	addStatusLog(DB, rec.ID, from, StatusSupplied, "补样完成，待重排期:"+notice.NoticeNo, op.ID)

	detail, _ := recordDetail(rec.ID)
	return ok(c, fiber.Map{
		"action":       "补样完成",
		"notice_no":    notice.NoticeNo,
		"next_todo":    "受理端进行重排期 (POST /api/schedule, is_re_schedule=true)",
		"detail":       detail,
	})
}

// GET /api/supplement?record_id=xxx 补样通知回看
func ListSupplements(c *fiber.Ctx) error {
	rid := c.QueryInt("record_id")
	if rid <= 0 {
		// 全部补样通知，支持按状态过滤
		status := c.Query("status")
		q := DB.Preload("Issuer").Preload("Replenisher").Order("id DESC")
		if status != "" {
			q = q.Where("status = ?", status)
		}
		var list []SupplementNotice
		q.Find(&list)
		return ok(c, list)
	}
	var list []SupplementNotice
	DB.Where("record_id = ?", rid).
		Preload("Issuer").
		Preload("Replenisher").
		Order("id DESC").
		Find(&list)

	var rec AppraisalRecord
	DB.First(&rec, rid)

	return ok(c, fiber.Map{
		"case_no":       rec.CaseNo,
		"status":        rec.Status,
		"current_carry": rec.CurrentComment,
		"total":         len(list),
		"notices":       list,
	})
}

// ----------------- 5. 详情查询（同一条记录看全量：排期+补样+状态链+备注链） -----------------

// GET /api/record/:id 详情
func GetRecordDetail(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	r, err := recordDetail(uint(id))
	if err != nil {
		return fail(c, 404, "not found")
	}
	resp := buildResponsibilitySummary(r)
	return ok(c, fiber.Map{
		"basic": fiber.Map{
			"case_no":        r.CaseNo,
			"entrust_dept":   r.EntrustDept,
			"entrust_date":   r.EntrustDate,
			"entrust_item":   r.EntrustItem,
			"client_name":    r.ClientName,
			"status":         r.Status,
			"status_text":    statusText(r.Status),
			"reject_reason":  r.RejectReason,
			"current_comment": r.CurrentComment,
			"carry_comment_chain": collectCarryComment(r.ID),
			"sample_received": r.SampleReceived,
			"archive_no":     r.ArchiveNo,
			"archive_date":   r.ArchiveDate,
			"accept_clerk":   r.AcceptClerk,
			"expert":         r.Expert,
			"qc":             r.QC,
			"responsibility": resp,
		},
		"schedules":          r.Schedules,
		"supplement_notices": r.SupplementNotices,
		"status_logs":        r.StatusLogs,
		"comment_logs":       r.CommentLogs,
		"opinion": fiber.Map{
			"draft": r.OpinionDraft,
			"final": r.OpinionFinal,
		},
	})
}

// GET /api/records 列表查询
func ListRecords(c *fiber.Ctx) error {
	status := c.Query("status")
	caseNo := c.Query("case_no")
	q := DB.Model(&AppraisalRecord{}).
		Preload("AcceptClerk").
		Preload("Expert").
		Preload("QC").
		Preload("SupplementNotices.Issuer").
		Preload("StatusLogs.Operator").
		Order("id DESC")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if caseNo != "" {
		q = q.Where("case_no LIKE ?", "%"+caseNo+"%")
	}
	var list []AppraisalRecord
	q.Find(&list)

	out := make([]fiber.Map, 0, len(list))
	for _, r := range list {
		resp := buildResponsibilitySummary(&r)
		out = append(out, fiber.Map{
			"id":               r.ID,
			"case_no":          r.CaseNo,
			"entrust_dept":     r.EntrustDept,
			"entrust_item":     r.EntrustItem,
			"client_name":      r.ClientName,
			"status":           r.Status,
			"status_text":      statusText(r.Status),
			"current_comment":  r.CurrentComment,
			"sample_received":  r.SampleReceived,
			"archive_no":       r.ArchiveNo,
			"created_at":       r.CreatedAt,
			"updated_at":       r.UpdatedAt,
			"responsibility":   resp,
		})
	}
	return ok(c, out)
}

// ----------------- 6. 工具接口：获取用户列表 -----------------

// GET /api/users
func ListUsers(c *fiber.Ctx) error {
	var list []User
	DB.Find(&list)
	return ok(c, list)
}

func countNotices(rid uint) int {
	var c int64
	DB.Model(&SupplementNotice{}).Where("record_id = ?", rid).Count(&c)
	return int(c)
}

func ifElse[T any](cond bool, a, b T) T {
	if cond {
		return a
	}
	return b
}

// 让 DB 包外可用
var _ = gorm.ErrRecordNotFound
