package handlers

import (
	"microloan-api/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var DB *gorm.DB

func SetDB(db *gorm.DB) {
	DB = db
}

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func ok(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: data})
}

func fail(c *gin.Context, code int, message string) {
	c.JSON(code, Response{Code: code, Message: message})
}

func GetLoans(c *gin.Context) {
	status := c.Query("status")
	keyword := c.Query("keyword")

	var loans []models.Loan
	query := DB.Model(&models.Loan{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if keyword != "" {
		query = query.Where("customer_name LIKE ? OR loan_no LIKE ? OR customer_phone LIKE ?",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	query.Order("created_at DESC").Find(&loans)
	ok(c, loans)
}

func GetLoan(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var loan models.Loan
	if err := DB.Preload("RepaymentPlans").
		Preload("CollectionRecords").
		Preload("ExtensionApps.ApprovalDecision").
		Preload("OperationLogs").
		First(&loan, id).Error; err != nil {
		fail(c, http.StatusNotFound, "借款记录不存在")
		return
	}
	ok(c, loan)
}

func CreateLoan(c *gin.Context) {
	var loan models.Loan
	if err := c.ShouldBindJSON(&loan); err != nil {
		fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	loan.CreatedAt = time.Now()
	loan.UpdatedAt = time.Now()

	if err := DB.Create(&loan).Error; err != nil {
		fail(c, http.StatusInternalServerError, "创建失败: "+err.Error())
		return
	}

	addLog(loan.ID, loan.CustomerName, models.RoleManager, "创建借款", "创建借款记录: "+loan.LoanNo, c.ClientIP())
	ok(c, loan)
}

func UpdateLoan(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var loan models.Loan
	if err := DB.First(&loan, id).Error; err != nil {
		fail(c, http.StatusNotFound, "借款记录不存在")
		return
	}

	if err := c.ShouldBindJSON(&loan); err != nil {
		fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	loan.ID = uint(id)
	loan.UpdatedAt = time.Now()

	DB.Save(&loan)
	ok(c, loan)
}

func GetRepaymentPlans(c *gin.Context) {
	loanID, _ := strconv.Atoi(c.Query("loan_id"))

	var plans []models.RepaymentPlan
	query := DB.Model(&models.RepaymentPlan{})
	if loanID > 0 {
		query = query.Where("loan_id = ?", loanID)
	}
	query.Order("period_no ASC").Find(&plans)
	ok(c, plans)
}

func CreateRepaymentPlan(c *gin.Context) {
	var plan models.RepaymentPlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	plan.CreatedAt = time.Now()
	plan.UpdatedAt = time.Now()
	DB.Create(&plan)
	ok(c, plan)
}

func UpdateRepaymentPlan(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var plan models.RepaymentPlan
	if err := DB.First(&plan, id).Error; err != nil {
		fail(c, http.StatusNotFound, "还款计划不存在")
		return
	}
	if err := c.ShouldBindJSON(&plan); err != nil {
		fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	plan.ID = uint(id)
	plan.UpdatedAt = time.Now()
	DB.Save(&plan)
	ok(c, plan)
}

func GetCollectionRecords(c *gin.Context) {
	loanID, _ := strconv.Atoi(c.Query("loan_id"))

	var records []models.CollectionRecord
	query := DB.Model(&models.CollectionRecord{})
	if loanID > 0 {
		query = query.Where("loan_id = ?", loanID)
	}
	query.Order("collection_time DESC").Find(&records)
	ok(c, records)
}

func GetCollectionRecord(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var record models.CollectionRecord
	if err := DB.First(&record, id).Error; err != nil {
		fail(c, http.StatusNotFound, "催收记录不存在")
		return
	}
	ok(c, record)
}

func CreateCollectionRecord(c *gin.Context) {
	var record models.CollectionRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	record.CreatedAt = time.Now()
	record.UpdatedAt = time.Now()
	if record.CollectionTime.IsZero() {
		record.CollectionTime = time.Now()
	}

	if err := DB.Create(&record).Error; err != nil {
		fail(c, http.StatusInternalServerError, "创建失败: "+err.Error())
		return
	}

	addLog(record.LoanID, record.CollectorName, record.CollectorRole,
		"新增催收记录", "催收方式:"+string(record.CollectionType)+" 联系结果:"+string(record.ContactResult),
		c.ClientIP())
	ok(c, record)
}

func UpdateCollectionRecord(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var record models.CollectionRecord
	if err := DB.First(&record, id).Error; err != nil {
		fail(c, http.StatusNotFound, "催收记录不存在")
		return
	}
	if err := c.ShouldBindJSON(&record); err != nil {
		fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	record.ID = uint(id)
	record.UpdatedAt = time.Now()
	DB.Save(&record)
	ok(c, record)
}

func GetExtensionApplications(c *gin.Context) {
	loanID, _ := strconv.Atoi(c.Query("loan_id"))
	status := c.Query("status")

	var apps []models.ExtensionApplication
	query := DB.Model(&models.ExtensionApplication{}).Preload("ApprovalDecision")
	if loanID > 0 {
		query = query.Where("loan_id = ?", loanID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("apply_time DESC").Find(&apps)
	ok(c, apps)
}

func GetExtensionApplication(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var app models.ExtensionApplication
	if err := DB.Preload("ApprovalDecision").First(&app, id).Error; err != nil {
		fail(c, http.StatusNotFound, "展期申请不存在")
		return
	}

	var loan models.Loan
	DB.Preload("CollectionRecords").First(&loan, app.LoanID)

	result := gin.H{
		"application":        app,
		"loan":               loan,
		"collection_history": loan.CollectionRecords,
	}
	ok(c, result)
}

func CreateExtensionApplication(c *gin.Context) {
	var app models.ExtensionApplication
	if err := c.ShouldBindJSON(&app); err != nil {
		fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	app.Status = models.ExtensionStatusPending
	app.CreatedAt = time.Now()
	app.UpdatedAt = time.Now()
	if app.ApplyTime.IsZero() {
		app.ApplyTime = time.Now()
	}

	if err := DB.Create(&app).Error; err != nil {
		fail(c, http.StatusInternalServerError, "创建失败: "+err.Error())
		return
	}

	addLog(app.LoanID, app.ApplicantName, app.ApplicantRole,
		"提交展期申请", "申请展期"+strconv.Itoa(app.ExtensionMonths)+"个月",
		c.ClientIP())
	ok(c, app)
}

func ApproveExtensionApplication(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var app models.ExtensionApplication
	if err := DB.First(&app, id).Error; err != nil {
		fail(c, http.StatusNotFound, "展期申请不存在")
		return
	}
	if app.Status != models.ExtensionStatusPending {
		fail(c, http.StatusBadRequest, "该申请已处理")
		return
	}

	var decision models.ApprovalDecision
	if err := c.ShouldBindJSON(&decision); err != nil {
		fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	decision.ExtensionAppID = app.ID
	decision.DecisionTime = time.Now()
	decision.CreatedAt = time.Now()
	decision.UpdatedAt = time.Now()

	tx := DB.Begin()

	if err := tx.Create(&decision).Error; err != nil {
		tx.Rollback()
		fail(c, http.StatusInternalServerError, "审批失败: "+err.Error())
		return
	}

	app.Status = decision.Decision
	app.UpdatedAt = time.Now()
	if err := tx.Save(&app).Error; err != nil {
		tx.Rollback()
		fail(c, http.StatusInternalServerError, "更新申请状态失败")
		return
	}

	if decision.Decision == models.ExtensionStatusApproved {
		var loan models.Loan
		tx.First(&loan, app.LoanID)
		loan.Status = models.LoanStatusExtended
		loan.EndDate = app.NewEndDate
		loan.UpdatedAt = time.Now()
		tx.Save(&loan)

		var plans []models.RepaymentPlan
		tx.Where("loan_id = ? AND status IN ?", app.LoanID,
			[]models.RepaymentStatus{models.RepaymentStatusPending, models.RepaymentStatusOverdue}).
			Find(&plans)
		for _, p := range plans {
			p.DueDate = p.DueDate.AddDate(0, app.ExtensionMonths, 0)
			p.Status = models.RepaymentStatusExtended
			p.UpdatedAt = time.Now()
			tx.Save(&p)
		}
	}

	tx.Commit()

	addLog(app.LoanID, decision.ApproverName, decision.ApproverRole,
		"展期审批-"+string(decision.Decision), decision.Remark, c.ClientIP())

	ok(c, gin.H{"application": app, "decision": decision})
}

func GetOperationLogs(c *gin.Context) {
	loanID, _ := strconv.Atoi(c.Query("loan_id"))

	var logs []models.OperationLog
	query := DB.Model(&models.OperationLog{})
	if loanID > 0 {
		query = query.Where("loan_id = ?", loanID)
	}
	query.Order("created_at DESC").Find(&logs)
	ok(c, logs)
}

func addLog(loanID uint, operator string, role models.Role, action, detail, ip string) {
	log := models.OperationLog{
		LoanID:    loanID,
		Operator:  operator,
		Role:      role,
		Action:    action,
		Detail:    detail,
		IPAddress: ip,
		CreatedAt: time.Now(),
	}
	DB.Create(&log)
}

func GetLoanFullTimeline(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var loan models.Loan
	if err := DB.First(&loan, id).Error; err != nil {
		fail(c, http.StatusNotFound, "借款记录不存在")
		return
	}

	var collections []models.CollectionRecord
	DB.Where("loan_id = ?", id).Order("collection_time ASC").Find(&collections)

	var extensions []models.ExtensionApplication
	DB.Preload("ApprovalDecision").Where("loan_id = ?", id).Order("apply_time ASC").Find(&extensions)

	var logs []models.OperationLog
	DB.Where("loan_id = ?", id).Order("created_at ASC").Find(&logs)

	type TimelineItem struct {
		Time   time.Time   `json:"time"`
		Type   string      `json:"type"`
		Title  string      `json:"title"`
		Detail interface{} `json:"detail"`
	}

	var timeline []TimelineItem

	for _, c := range collections {
		timeline = append(timeline, TimelineItem{
			Time:   c.CollectionTime,
			Type:   "collection",
			Title:  "催收记录 - " + string(c.CollectionType),
			Detail: c,
		})
	}
	for _, e := range extensions {
		timeline = append(timeline, TimelineItem{
			Time:   e.ApplyTime,
			Type:   "extension_apply",
			Title:  "展期申请",
			Detail: e,
		})
		if e.ApprovalDecision != nil {
			timeline = append(timeline, TimelineItem{
				Time:   e.ApprovalDecision.DecisionTime,
				Type:   "extension_decision",
				Title:  "展期审批 - " + string(e.ApprovalDecision.Decision),
				Detail: e.ApprovalDecision,
			})
		}
	}
	for _, l := range logs {
		timeline = append(timeline, TimelineItem{
			Time:   l.CreatedAt,
			Type:   "operation",
			Title:  l.Action,
			Detail: l,
		})
	}

	for i := 0; i < len(timeline)-1; i++ {
		for j := i + 1; j < len(timeline); j++ {
			if timeline[i].Time.After(timeline[j].Time) {
				timeline[i], timeline[j] = timeline[j], timeline[i]
			}
		}
	}

	ok(c, gin.H{
		"loan":     loan,
		"timeline": timeline,
	})
}
