package database

import (
	"log"
	"meat-inspection-system/models"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("meat_inspection.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("连接数据库失败:", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.QuarantineCertificate{},
		&models.CertificateNote{},
		&models.QualityRelease{},
		&models.ReleaseNote{},
		&models.IdempotencyRecord{},
	)
	if err != nil {
		log.Fatal("数据库迁移失败:", err)
	}

	seedData()
}

func seedData() {
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		return
	}

	log.Println("正在初始化样例数据...")

	users := []models.User{
		{Username: "foreman1", Password: "123456", Name: "张班长", Role: models.RoleProductionForeman},
		{Username: "inspector1", Password: "123456", Name: "李质检", Role: models.RoleQualityInspector},
		{Username: "coldstorage1", Password: "123456", Name: "王冷库", Role: models.RoleColdStorageAdmin},
	}
	for i := range users {
		DB.Create(&users[i])
	}

	now := time.Now()

	cert1 := models.QuarantineCertificate{
		CertificateNo: "JY20260601001",
		BatchNo:       "PC20260601A",
		ProductName:   "猪白条肉",
		Weight:        1500.5,
		Source:        "XX养殖场",
		SlaughterDate: &now,
		Status:        models.CertStatusBlocked,
		SubmittedByID: users[0].ID,
		BlockedReason: "缺少耳标号记录，需补充后重新提交",
	}
	DB.Create(&cert1)
	DB.Create(&models.CertificateNote{CertificateID: cert1.ID, Content: "提交检疫证明：猪白条肉 1500.5kg，来自XX养殖场", CreatedByID: users[0].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert1.ID, Content: "现场记录：这批猪来自XX养殖场，共3号栏，检疫时发现耳标不全", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert1.ID, Content: "状态变更：待处理 → 已卡住，原因：缺少耳标号记录，需补充后重新提交", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert1.ID, Content: "生产班长确认：已联系养殖场补充耳标信息，预计明天上午补齐", CreatedByID: users[0].ID})

	cert2 := models.QuarantineCertificate{
		CertificateNo: "JY20260601002",
		BatchNo:       "PC20260601B",
		ProductName:   "牛分割肉",
		Weight:        800.0,
		Source:        "YY肉牛基地",
		SlaughterDate: &now,
		Status:        models.CertStatusApproved,
		InspectorID:   &users[1].ID,
		SubmittedByID: users[0].ID,
	}
	DB.Create(&cert2)
	DB.Create(&models.CertificateNote{CertificateID: cert2.ID, Content: "提交检疫证明：牛分割肉 800.0kg，来自YY肉牛基地", CreatedByID: users[0].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert2.ID, Content: "状态变更：待处理 → 处理中", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert2.ID, Content: "检疫合格，各项指标正常，准许进入下一道工序", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert2.ID, Content: "状态变更：处理中 → 已通过", CreatedByID: users[1].ID})

	cert3 := models.QuarantineCertificate{
		CertificateNo: "JY20260602003",
		BatchNo:       "PC20260602A",
		ProductName:   "羊胴体",
		Weight:        450.0,
		Source:        "ZZ牧场",
		Status:        models.CertStatusPending,
		SubmittedByID: users[0].ID,
	}
	DB.Create(&cert3)
	DB.Create(&models.CertificateNote{CertificateID: cert3.ID, Content: "提交检疫证明：羊胴体 450.0kg，来自ZZ牧场", CreatedByID: users[0].ID})

	cert4 := models.QuarantineCertificate{
		CertificateNo: "JY20260602004",
		BatchNo:       "PC20260602B",
		ProductName:   "猪排骨",
		Weight:        300.0,
		Source:        "AA养殖合作社",
		Status:        models.CertStatusProcessing,
		InspectorID:   &users[1].ID,
		SubmittedByID: users[0].ID,
	}
	DB.Create(&cert4)
	DB.Create(&models.CertificateNote{CertificateID: cert4.ID, Content: "提交检疫证明：猪排骨 300.0kg，来自AA养殖合作社", CreatedByID: users[0].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert4.ID, Content: "状态变更：待处理 → 处理中", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert4.ID, Content: "正在进行感官检验和采样检测，预计1小时后出结果", CreatedByID: users[1].ID})

	cert5 := models.QuarantineCertificate{
		CertificateNo: "JY20260602005",
		BatchNo:       "PC20260602C",
		ProductName:   "猪内脏",
		Weight:        200.0,
		Source:        "BB养殖场",
		Status:        models.CertStatusRejected,
		InspectorID:   &users[1].ID,
		SubmittedByID: users[0].ID,
		BlockedReason: "发现异常病变，不符合检疫标准",
	}
	DB.Create(&cert5)
	DB.Create(&models.CertificateNote{CertificateID: cert5.ID, Content: "提交检疫证明：猪内脏 200.0kg，来自BB养殖场", CreatedByID: users[0].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert5.ID, Content: "状态变更：待处理 → 处理中", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert5.ID, Content: "检疫发现异常病变，色泽异常，需做无害化处理", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert5.ID, Content: "状态变更：处理中 → 已驳回", CreatedByID: users[1].ID})

	cert6 := models.QuarantineCertificate{
		CertificateNo: "JY20260603006",
		BatchNo:       "PC20260603A",
		ProductName:   "牛肉块",
		Weight:        600.0,
		Source:        "CC肉牛场",
		Status:        models.CertStatusApproved,
		InspectorID:   &users[1].ID,
		SubmittedByID: users[0].ID,
	}
	DB.Create(&cert6)
	DB.Create(&models.CertificateNote{CertificateID: cert6.ID, Content: "提交检疫证明：牛肉块 600.0kg，来自CC肉牛场", CreatedByID: users[0].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert6.ID, Content: "状态变更：待处理 → 处理中", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert6.ID, Content: "检疫合格，已通过", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert6.ID, Content: "状态变更：处理中 → 已通过", CreatedByID: users[1].ID})
	DB.Create(&models.CertificateNote{CertificateID: cert6.ID, Content: "创建关联放行单：ZJ20260603006", CreatedByID: users[1].ID})

	release1 := models.QualityRelease{
		ReleaseNo:        "ZJ20260601001",
		CertificateID:    &cert2.ID,
		BatchNo:          "PC20260601B",
		ProductName:      "牛分割肉",
		InspectionItems:  "感官指标、微生物检测、兽药残留",
		InspectionResult: "全部合格",
		Status:           models.ReleaseStatusOnHold,
		SubmittedByID:    users[1].ID,
		HoldReason:       "等待冷库入库确认",
	}
	DB.Create(&release1)
	DB.Create(&models.ReleaseNote{ReleaseID: release1.ID, Content: "从检疫证明 JY20260601002 创建关联放行单", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release1.ID, Content: "状态变更：待处理 → 审核中", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release1.ID, Content: "质检完成，结果全部合格，已通知冷库准备入库", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release1.ID, Content: "状态变更：审核中 → 待确认，原因：等待冷库入库确认", CreatedByID: users[1].ID})

	release2 := models.QualityRelease{
		ReleaseNo:        "ZJ20260601002",
		BatchNo:          "PC20260530C",
		ProductName:      "猪副产物",
		InspectionItems:  "感官指标",
		InspectionResult: "合格",
		Status:           models.ReleaseStatusReleased,
		ReviewerID:       &users[1].ID,
		SubmittedByID:    users[1].ID,
	}
	DB.Create(&release2)
	DB.Create(&models.ReleaseNote{ReleaseID: release2.ID, Content: "提交质检放行申请：猪副产物", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release2.ID, Content: "状态变更：待处理 → 审核中", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release2.ID, Content: "状态变更：审核中 → 质检通过", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release2.ID, Content: "状态变更：质检通过 → 待确认", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release2.ID, Content: "冷库已入库，数量核对无误", CreatedByID: users[2].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release2.ID, Content: "状态变更：待确认 → 已放行", CreatedByID: users[2].ID})

	release3 := models.QualityRelease{
		ReleaseNo:        "ZJ20260602003",
		BatchNo:          "PC20260601D",
		ProductName:      "猪精肉",
		InspectionItems:  "感官指标、水分检测",
		InspectionResult: "待检测",
		Status:           models.ReleaseStatusReviewing,
		SubmittedByID:    users[1].ID,
	}
	DB.Create(&release3)
	DB.Create(&models.ReleaseNote{ReleaseID: release3.ID, Content: "提交质检放行申请：猪精肉", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release3.ID, Content: "状态变更：待处理 → 审核中", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release3.ID, Content: "正在进行水分含量检测", CreatedByID: users[1].ID})

	release4 := models.QualityRelease{
		ReleaseNo:        "ZJ20260602004",
		BatchNo:          "PC20260601E",
		ProductName:      "猪五花肉",
		InspectionItems:  "感官指标",
		InspectionResult: "脂肪含量超标",
		Status:           models.ReleaseStatusFailed,
		ReviewerID:       &users[1].ID,
		SubmittedByID:    users[1].ID,
	}
	DB.Create(&release4)
	DB.Create(&models.ReleaseNote{ReleaseID: release4.ID, Content: "提交质检放行申请：猪五花肉", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release4.ID, Content: "状态变更：待处理 → 审核中", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release4.ID, Content: "质检发现脂肪含量超标，不符合出厂标准", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release4.ID, Content: "状态变更：审核中 → 质检不通过", CreatedByID: users[1].ID})

	release5 := models.QualityRelease{
		ReleaseNo:        "ZJ20260603005",
		BatchNo:          "PC20260603B",
		ProductName:      "牛腱子肉",
		InspectionItems:  "",
		InspectionResult: "",
		Status:           models.ReleaseStatusPending,
		SubmittedByID:    users[1].ID,
	}
	DB.Create(&release5)
	DB.Create(&models.ReleaseNote{ReleaseID: release5.ID, Content: "提交质检放行申请：牛腱子肉", CreatedByID: users[1].ID})

	release6 := models.QualityRelease{
		ReleaseNo:        "ZJ20260603006",
		CertificateID:    &cert6.ID,
		BatchNo:          "PC20260603A",
		ProductName:      "牛肉块",
		InspectionItems:  "感官指标、微生物检测",
		InspectionResult: "合格",
		Status:           models.ReleaseStatusPassed,
		ReviewerID:       &users[1].ID,
		SubmittedByID:    users[1].ID,
	}
	DB.Create(&release6)
	DB.Create(&models.ReleaseNote{ReleaseID: release6.ID, Content: "从检疫证明 JY20260603006 创建关联放行单", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release6.ID, Content: "状态变更：待处理 → 审核中", CreatedByID: users[1].ID})
	DB.Create(&models.ReleaseNote{ReleaseID: release6.ID, Content: "状态变更：审核中 → 质检通过", CreatedByID: users[1].ID})

	log.Println("样例数据初始化完成")
}
