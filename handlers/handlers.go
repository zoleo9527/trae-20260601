package handlers

import (
	"encoding/json"
	"meat-inspection-system/database"
	"meat-inspection-system/middleware"
	"meat-inspection-system/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var user models.User
	if err := database.DB.Where("username = ? AND password = ?", req.Username, req.Password).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "用户名或密码错误"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"name":    user.Name,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenStr, err := token.SignedString(middleware.JWTSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "生成令牌失败"})
	}

	return c.JSON(fiber.Map{
		"token": tokenStr,
		"user":  user,
	})
}

func ListCertificates(c *fiber.Ctx) error {
	status := c.Query("status")
	var certs []models.QuarantineCertificate

	query := database.DB.Preload("SubmittedBy").Preload("Inspector").Preload("Notes.CreatedBy").Order("created_at desc")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&certs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询失败"})
	}

	return c.JSON(certs)
}

func GetCertificate(c *fiber.Ctx) error {
	id := c.Params("id")
	var cert models.QuarantineCertificate

	if err := database.DB.Preload("SubmittedBy").Preload("Inspector").Preload("Notes.CreatedBy").Preload("Releases").First(&cert, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "检疫证明不存在"})
	}

	return c.JSON(cert)
}

type CreateReleaseFromCertRequest struct {
	ReleaseNo       string `json:"release_no"`
	InspectionItems  string `json:"inspection_items"`
	InspectionResult string `json:"inspection_result"`
}

func CreateReleaseFromCertificate(c *fiber.Ctx) error {
	certID := c.Params("id")
	user := middleware.GetCurrentUser(c)
	var req CreateReleaseFromCertRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var cert models.QuarantineCertificate
	if err := database.DB.First(&cert, certID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "检疫证明不存在"})
	}

	if cert.Status != models.CertStatusApproved {
		return c.Status(400).JSON(fiber.Map{"error": "只有已通过的检疫证明才能创建放行单"})
	}

	var existing models.QualityRelease
	if err := database.DB.Where("release_no = ?", req.ReleaseNo).First(&existing).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "放行单编号已存在"})
	}

	certIDUint := parseUint(certID)

	release := models.QualityRelease{
		ReleaseNo:        req.ReleaseNo,
		CertificateID:  &certIDUint,
		BatchNo:        cert.BatchNo,
		ProductName:    cert.ProductName,
		InspectionItems:  req.InspectionItems,
		InspectionResult: req.InspectionResult,
		Status:         models.ReleaseStatusPending,
		SubmittedByID:  user.ID,
	}

	if err := database.DB.Create(&release).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "创建失败"})
	}

	noteContent := "从检疫证明 " + cert.CertificateNo + " 创建关联放行单"
	releaseNote := models.ReleaseNote{
		ReleaseID:   release.ID,
		Content:     noteContent,
		CreatedByID: user.ID,
	}
	database.DB.Create(&releaseNote)

	certNote := models.CertificateNote{
		CertificateID: cert.ID,
		Content:       "创建关联放行单：" + req.ReleaseNo,
		CreatedByID:   user.ID,
	}
	database.DB.Create(&certNote)

	database.DB.Preload("SubmittedBy").Preload("Certificate").First(&release, release.ID)
	return c.Status(201).JSON(release)
}

type CreateCertificateRequest struct {
	IdempotencyKey string  `json:"-"`
	CertificateNo  string  `json:"certificate_no"`
	BatchNo        string  `json:"batch_no"`
	ProductName    string  `json:"product_name"`
	Weight         float64 `json:"weight"`
	Source         string  `json:"source"`
	SlaughterDate  string  `json:"slaughter_date"`
}

func CreateCertificate(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	var req CreateCertificateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var existing models.QuarantineCertificate
	if err := database.DB.Where("certificate_no = ?", req.CertificateNo).First(&existing).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "检疫证明编号已存在"})
	}

	var slaughterDate *time.Time
	if req.SlaughterDate != "" {
		if t, err := time.Parse("2006-01-02", req.SlaughterDate); err == nil {
			slaughterDate = &t
		}
	}

	var idemKey *string
	if k := c.Get("X-Idempotency-Key"); k != "" {
		idemKey = &k
	}

	cert := models.QuarantineCertificate{
		CertificateNo:  req.CertificateNo,
		IdempotencyKey: idemKey,
		BatchNo:        req.BatchNo,
		ProductName:    req.ProductName,
		Weight:         req.Weight,
		Source:         req.Source,
		SlaughterDate:  slaughterDate,
		Status:         models.CertStatusPending,
		SubmittedByID:  user.ID,
	}

	if err := database.DB.Create(&cert).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "创建失败"})
	}

	database.DB.Preload("SubmittedBy").First(&cert, cert.ID)

	resp, _ := json.Marshal(cert)
	middleware.SaveIdempotencyResponse(c, resp)

	return c.Status(201).JSON(cert)
}

type UpdateCertificateStatusRequest struct {
	Status        models.CertificateStatus `json:"status"`
	BlockedReason string                   `json:"blocked_reason"`
}

func UpdateCertificateStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	user := middleware.GetCurrentUser(c)
	var req UpdateCertificateStatusRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var cert models.QuarantineCertificate
	if err := database.DB.First(&cert, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "检疫证明不存在"})
	}

	oldStatus := cert.Status
	cert.Status = req.Status
	cert.BlockedReason = req.BlockedReason
	if req.Status == models.CertStatusApproved || req.Status == models.CertStatusRejected || req.Status == models.CertStatusProcessing {
		cert.InspectorID = &user.ID
	}

	if err := database.DB.Save(&cert).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "更新失败"})
	}

	noteContent := "状态变更：" + statusNameCert(oldStatus) + " → " + statusNameCert(req.Status)
	if req.Status == models.CertStatusBlocked && req.BlockedReason != "" {
		noteContent += "，原因：" + req.BlockedReason
	}
	note := models.CertificateNote{
		CertificateID: parseUint(id),
		Content:       noteContent,
		CreatedByID:   user.ID,
	}
	database.DB.Create(&note)

	database.DB.Preload("SubmittedBy").Preload("Inspector").Preload("Notes.CreatedBy").First(&cert, id)
	return c.JSON(cert)
}

func statusNameCert(s models.CertificateStatus) string {
	m := map[models.CertificateStatus]string{
		models.CertStatusPending:    "待处理",
		models.CertStatusProcessing: "处理中",
		models.CertStatusApproved:   "已通过",
		models.CertStatusRejected:   "已驳回",
		models.CertStatusBlocked:    "已卡住",
	}
	return m[s]
}

type AddNoteRequest struct {
	Content string `json:"content"`
}

func AddCertificateNote(c *fiber.Ctx) error {
	id := c.Params("id")
	user := middleware.GetCurrentUser(c)
	var req AddNoteRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	note := models.CertificateNote{
		CertificateID: parseUint(id),
		Content:       req.Content,
		CreatedByID:   user.ID,
	}

	if err := database.DB.Create(&note).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "添加备注失败"})
	}

	database.DB.Preload("CreatedBy").First(&note, note.ID)
	return c.Status(201).JSON(note)
}

func ListReleases(c *fiber.Ctx) error {
	status := c.Query("status")
	var releases []models.QualityRelease

	query := database.DB.Preload("SubmittedBy").Preload("Reviewer").Preload("Certificate").Preload("Notes.CreatedBy").Order("created_at desc")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&releases).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询失败"})
	}

	return c.JSON(releases)
}

func GetRelease(c *fiber.Ctx) error {
	id := c.Params("id")
	var release models.QualityRelease

	if err := database.DB.Preload("SubmittedBy").Preload("Reviewer").Preload("Certificate").Preload("Notes.CreatedBy").First(&release, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "质检放行单不存在"})
	}

	return c.JSON(release)
}

type CreateReleaseRequest struct {
	ReleaseNo        string `json:"release_no"`
	CertificateID    *uint  `json:"certificate_id"`
	BatchNo          string `json:"batch_no"`
	ProductName      string `json:"product_name"`
	InspectionItems  string `json:"inspection_items"`
	InspectionResult string `json:"inspection_result"`
}

func CreateRelease(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	var req CreateReleaseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var existing models.QualityRelease
	if err := database.DB.Where("release_no = ?", req.ReleaseNo).First(&existing).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "放行单编号已存在"})
	}

	var idemKeyRel *string
	if k := c.Get("X-Idempotency-Key"); k != "" {
		idemKeyRel = &k
	}

	release := models.QualityRelease{
		ReleaseNo:        req.ReleaseNo,
		IdempotencyKey:   idemKeyRel,
		CertificateID:    req.CertificateID,
		BatchNo:          req.BatchNo,
		ProductName:      req.ProductName,
		InspectionItems:  req.InspectionItems,
		InspectionResult: req.InspectionResult,
		Status:           models.ReleaseStatusPending,
		SubmittedByID:    user.ID,
	}

	if err := database.DB.Create(&release).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "创建失败"})
	}

	database.DB.Preload("SubmittedBy").First(&release, release.ID)

	resp, _ := json.Marshal(release)
	middleware.SaveIdempotencyResponse(c, resp)

	return c.Status(201).JSON(release)
}

type UpdateReleaseStatusRequest struct {
	Status     models.ReleaseStatus `json:"status"`
	HoldReason string               `json:"hold_reason"`
}

func UpdateReleaseStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	user := middleware.GetCurrentUser(c)
	var req UpdateReleaseStatusRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var release models.QualityRelease
	if err := database.DB.First(&release, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "质检放行单不存在"})
	}

	oldStatus := release.Status
	release.Status = req.Status
	release.HoldReason = req.HoldReason
	if req.Status == models.ReleaseStatusReviewing || req.Status == models.ReleaseStatusPassed || req.Status == models.ReleaseStatusFailed {
		release.ReviewerID = &user.ID
	}

	if err := database.DB.Save(&release).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "更新失败"})
	}

	noteContent := "状态变更：" + statusNameRelease(oldStatus) + " → " + statusNameRelease(req.Status)
	if req.Status == models.ReleaseStatusOnHold && req.HoldReason != "" {
		noteContent += "，原因：" + req.HoldReason
	}
	note := models.ReleaseNote{
		ReleaseID:   parseUint(id),
		Content:     noteContent,
		CreatedByID: user.ID,
	}
	database.DB.Create(&note)

	database.DB.Preload("SubmittedBy").Preload("Reviewer").Preload("Notes.CreatedBy").First(&release, id)
	return c.JSON(release)
}

func statusNameRelease(s models.ReleaseStatus) string {
	m := map[models.ReleaseStatus]string{
		models.ReleaseStatusPending:   "待处理",
		models.ReleaseStatusReviewing: "审核中",
		models.ReleaseStatusPassed:    "质检通过",
		models.ReleaseStatusFailed:    "质检不通过",
		models.ReleaseStatusOnHold:    "待确认",
		models.ReleaseStatusReleased:  "已放行",
	}
	return m[s]
}

func AddReleaseNote(c *fiber.Ctx) error {
	id := c.Params("id")
	user := middleware.GetCurrentUser(c)
	var req AddNoteRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	note := models.ReleaseNote{
		ReleaseID:   parseUint(id),
		Content:     req.Content,
		CreatedByID: user.ID,
	}

	if err := database.DB.Create(&note).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "添加备注失败"})
	}

	database.DB.Preload("CreatedBy").First(&note, note.ID)
	return c.Status(201).JSON(note)
}

func GetDashboardStats(c *fiber.Ctx) error {
	var certPending, certBlocked, certApproved int64
	var releasePending, releaseReviewing, releaseOnHold, releaseReleased int64

	database.DB.Model(&models.QuarantineCertificate{}).Where("status = ?", models.CertStatusPending).Count(&certPending)
	database.DB.Model(&models.QuarantineCertificate{}).Where("status = ?", models.CertStatusBlocked).Count(&certBlocked)
	database.DB.Model(&models.QuarantineCertificate{}).Where("status = ?", models.CertStatusApproved).Count(&certApproved)

	database.DB.Model(&models.QualityRelease{}).Where("status = ?", models.ReleaseStatusPending).Count(&releasePending)
	database.DB.Model(&models.QualityRelease{}).Where("status = ?", models.ReleaseStatusReviewing).Count(&releaseReviewing)
	database.DB.Model(&models.QualityRelease{}).Where("status = ?", models.ReleaseStatusOnHold).Count(&releaseOnHold)
	database.DB.Model(&models.QualityRelease{}).Where("status = ?", models.ReleaseStatusReleased).Count(&releaseReleased)

	return c.JSON(fiber.Map{
		"certificates": fiber.Map{
			"pending":  certPending,
			"blocked":  certBlocked,
			"approved": certApproved,
		},
		"releases": fiber.Map{
			"pending":    releasePending,
			"reviewing":  releaseReviewing,
			"on_hold":    releaseOnHold,
			"released":   releaseReleased,
		},
	})
}

func GetBlockedItems(c *fiber.Ctx) error {
	var blockedCerts []models.QuarantineCertificate
	var onHoldReleases []models.QualityRelease

	database.DB.Preload("SubmittedBy").Preload("Notes.CreatedBy").Where("status = ?", models.CertStatusBlocked).Order("created_at desc").Find(&blockedCerts)
	database.DB.Preload("SubmittedBy").Preload("Certificate").Preload("Notes.CreatedBy").Where("status = ?", models.ReleaseStatusOnHold).Order("created_at desc").Find(&onHoldReleases)

	return c.JSON(fiber.Map{
		"blocked_certificates": blockedCerts,
		"on_hold_releases":     onHoldReleases,
	})
}

func parseUint(s string) uint {
	var n uint
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + uint(c-'0')
		}
	}
	return n
}
