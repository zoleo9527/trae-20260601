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

	note1 := models.CertificateNote{
		CertificateID: cert1.ID,
		Content:       "现场记录：这批猪来自XX养殖场，共3号栏，检疫时发现耳标不全",
		CreatedByID:   users[1].ID,
	}
	DB.Create(&note1)

	note2 := models.CertificateNote{
		CertificateID: cert1.ID,
		Content:       "生产班长确认：已联系养殖场补充耳标信息，预计明天上午补齐",
		CreatedByID:   users[0].ID,
	}
	DB.Create(&note2)

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

	note3 := models.CertificateNote{
		CertificateID: cert2.ID,
		Content:       "检疫合格，各项指标正常，准许进入下一道工序",
		CreatedByID:   users[1].ID,
	}
	DB.Create(&note3)

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

	release1 := models.QualityRelease{
		ReleaseNo:       "ZJ20260601001",
		CertificateID: &cert2.ID,
		BatchNo:       "PC20260601B",
		ProductName:   "牛分割肉",
		InspectionItems: "感官指标、微生物检测、兽药残留",
		InspectionResult: "全部合格",
		Status:        models.ReleaseStatusOnHold,
		SubmittedByID: users[1].ID,
		HoldReason:    "等待冷库入库确认",
	}
	DB.Create(&release1)

	rnote1 := models.ReleaseNote{
		ReleaseID: release1.ID,
		Content:   "质检完成，结果全部合格，已通知冷库准备入库",
		CreatedByID: users[1].ID,
	}
	DB.Create(&rnote1)

	release2 := models.QualityRelease{
		ReleaseNo:       "ZJ20260601002",
		BatchNo:       "PC20260530C",
		ProductName:   "猪副产物",
		InspectionItems: "感官指标",
		InspectionResult: "合格",
		Status:        models.ReleaseStatusReleased,
		ReviewerID:    &users[1].ID,
		SubmittedByID: users[1].ID,
	}
	DB.Create(&release2)

	rnote2 := models.ReleaseNote{
		ReleaseID: release2.ID,
		Content:   "冷库已入库，数量核对无误",
		CreatedByID: users[2].ID,
	}
	DB.Create(&rnote2)

	release3 := models.QualityRelease{
		ReleaseNo:       "ZJ20260602003",
		BatchNo:       "PC20260601D",
		ProductName:   "猪精肉",
		Status:        models.ReleaseStatusReviewing,
		SubmittedByID: users[1].ID,
	}
	DB.Create(&release3)

	log.Println("样例数据初始化完成")
}
