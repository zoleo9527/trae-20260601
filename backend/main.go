package main

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"moving-company/handlers"
	"moving-company/models"
	"moving-company/routes"
)

func main() {
	db, err := gorm.Open(sqlite.Open("moving.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Vehicle{},
		&models.Booking{},
		&models.VehicleSchedule{},
		&models.CrewMember{},
		&models.CrewAssignment{},
		&models.ExceptionRecord{},
		&models.Notification{},
		&models.DamagePhoto{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	seedData(db)

	app := fiber.New(fiber.Config{
		AppName: "Moving Company API",
	})

	app.Static("/docs", "./docs")

	h := handlers.NewHandler(db)
	routes.SetupRoutes(app, h)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Moving Company API",
			"docs":    "/docs/index.html",
			"version": "1.0.0",
		})
	})

	log.Println("Server starting on :3001")
	log.Println("API Documentation: http://localhost:3001/docs/index.html")
	log.Fatal(app.Listen(":3001"))
}

func seedData(db *gorm.DB) {
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		return
	}

	dispatcherID := uuid.New()
	leaderID := uuid.New()
	customerID := uuid.New()

	users := []models.User{
		{ID: dispatcherID, Username: "dispatcher", Password: "123456", Name: "调度张调度", Phone: "13800000001", Role: models.RoleDispatcher},
		{ID: leaderID, Username: "leader", Password: "123456", Name: "组长李队", Phone: "13800000002", Role: models.RoleLeader},
		{ID: customerID, Username: "customer", Password: "123456", Name: "客服王姐", Phone: "13800000003", Role: models.RoleCustomer},
	}
	for _, u := range users {
		if err := db.Create(&u).Error; err != nil {
			log.Printf("Failed to create user %s: %v", u.Username, err)
		}
	}
	log.Println("Created 3 users: dispatcher/leader/customer (password: 123456)")

	v1ID := uuid.New()
	v2ID := uuid.New()
	v3ID := uuid.New()

	vehicles := []models.Vehicle{
		{ID: v1ID, PlateNumber: "京A12345", VehicleType: "厢式货车", Capacity: "4.2米/5吨", Status: models.VehicleIdle, DriverName: "陈司机", DriverPhone: "13900000001"},
		{ID: v2ID, PlateNumber: "京A67890", VehicleType: "平板货车", Capacity: "6.8米/10吨", Status: models.VehicleIdle, DriverName: "孙司机", DriverPhone: "13900000002"},
		{ID: v3ID, PlateNumber: "京B11111", VehicleType: "厢式货车", Capacity: "9.6米/15吨", Status: models.VehicleMaintenance, DriverName: "周司机", DriverPhone: "13900000003"},
	}
	for _, v := range vehicles {
		if err := db.Create(&v).Error; err != nil {
			log.Printf("Failed to create vehicle %s: %v", v.PlateNumber, err)
		}
	}
	log.Println("Created 3 vehicles")

	c1ID := uuid.New()
	c2ID := uuid.New()
	c3ID := uuid.New()
	c4ID := uuid.New()

	crewMembers := []models.CrewMember{
		{ID: c1ID, Name: "王师傅", Phone: "13800000101", IDCard: "110101199001010001", Position: "组长", Status: models.CrewActive, Skill: "家具拆装,钢琴搬运"},
		{ID: c2ID, Name: "赵师傅", Phone: "13800000102", IDCard: "110101199001010002", Position: "搬运工", Status: models.CrewActive, Skill: "重物搬运,空调移机"},
		{ID: c3ID, Name: "钱师傅", Phone: "13800000103", IDCard: "110101199001010003", Position: "搬运工", Status: models.CrewActive, Skill: "易碎品搬运,打包"},
		{ID: c4ID, Name: "孙师傅", Phone: "13800000104", IDCard: "110101199001010004", Position: "司机", Status: models.CrewRest, Skill: "长途驾驶,车辆维护"},
	}
	for _, c := range crewMembers {
		if err := db.Create(&c).Error; err != nil {
			log.Printf("Failed to create crew member %s: %v", c.Name, err)
		}
	}
	log.Println("Created 4 crew members")

	baseDate := time.Now()
	b1ID := uuid.New()
	b2ID := uuid.New()
	b3ID := uuid.New()
	s2ID := uuid.New()
	s3ID := uuid.New()

	bookings := []models.Booking{
		{
			ID: b1ID, CustomerName: "刘先生", CustomerPhone: "13600000001",
			FromAddress: "北京市朝阳区建国路88号SOHO现代城A座1201",
			ToAddress:   "北京市海淀区中关村南大街5号院3号楼201",
			MoveDate:    baseDate.AddDate(0, 0, 3), MoveTime: "09:00-12:00",
			HouseSize: "两室一厅", Items: "床,衣柜,沙发,餐桌,电视柜,冰箱,洗衣机",
			BasePrice: 1200, ExtraPrice: 0, TotalPrice: 1200,
			Status: models.BookingCreated, Remarks: "有钢琴需要专业搬运",
		},
		{
			ID: b2ID, CustomerName: "陈女士", CustomerPhone: "13600000002",
			FromAddress: "北京市西城区金融街7号英蓝国际金融中心18层",
			ToAddress:   "北京市东城区东直门外大街48号东方银座D座1503",
			MoveDate:    baseDate.AddDate(0, 0, 1), MoveTime: "14:00-18:00",
			HouseSize: "三室两厅", Items: "全套家具,家电,衣物约30箱",
			BasePrice: 2500, ExtraPrice: 300, TotalPrice: 2800,
			Status:     models.BookingAssigned,
			VehicleID:  &v1ID,
			ScheduleID: &s2ID,
			Remarks:    "需要拆装大型衣柜",
		},
		{
			ID: b3ID, CustomerName: "周先生", CustomerPhone: "13600000003",
			FromAddress: "北京市丰台区南三环西路16号搜宝商务中心2号楼",
			ToAddress:   "北京市通州区新华大街万达广场B座2201",
			MoveDate:    baseDate, MoveTime: "08:00-12:00",
			HouseSize: "一室一厅", Items: "办公桌椅,文件柜,电脑设备约20台",
			BasePrice: 1800, ExtraPrice: 0, TotalPrice: 1800,
			Status:     models.BookingInProgress,
			VehicleID:  &v2ID,
			ScheduleID: &s3ID,
			Remarks:    "公司搬迁，需当天完成",
		},
	}
	for _, b := range bookings {
		if err := db.Create(&b).Error; err != nil {
			log.Printf("Failed to create booking %s: %v", b.CustomerName, err)
		}
	}
	log.Println("Created 3 bookings (pending/assigned/in_progress)")

	schedules := []models.VehicleSchedule{
		{
			ID: s2ID, VehicleID: v1ID, BookingID: b2ID,
			PlannedStart: baseDate.AddDate(0, 0, 1).Add(14 * time.Hour),
			PlannedEnd:   baseDate.AddDate(0, 0, 1).Add(18 * time.Hour),
			Status:       models.ScheduleAssigned,
			Remarks:      "派工: 王师傅(组长), 赵师傅, 钱师傅",
		},
		{
			ID: s3ID, VehicleID: v2ID, BookingID: b3ID,
			PlannedStart: baseDate.Add(8 * time.Hour),
			PlannedEnd:   baseDate.Add(12 * time.Hour),
			ActualStart:  &[]time.Time{baseDate.Add(8 * time.Hour)}[0],
			Status:       models.ScheduleLoading,
			Remarks:      "正在装车中，预计10点出发",
		},
	}
	for _, s := range schedules {
		if err := db.Create(&s).Error; err != nil {
			log.Printf("Failed to create schedule for booking %s: %v", s.BookingID, err)
		}
	}
	log.Println("Created 2 schedules")

	assignments := []models.CrewAssignment{
		{
			ID: uuid.New(), ScheduleID: s2ID, CrewID: c1ID, BookingID: b2ID,
			Role: "组长", Status: models.AssignmentAccepted,
		},
		{
			ID: uuid.New(), ScheduleID: s2ID, CrewID: c2ID, BookingID: b2ID,
			Role: "搬运工", Status: models.AssignmentAccepted,
		},
		{
			ID: uuid.New(), ScheduleID: s2ID, CrewID: c3ID, BookingID: b2ID,
			Role: "搬运工", Status: models.AssignmentPending,
		},
		{
			ID: uuid.New(), ScheduleID: s3ID, CrewID: c1ID, BookingID: b3ID,
			Role: "组长", Status: models.AssignmentWorking,
			ArrivedAt: &[]time.Time{baseDate.Add(8 * time.Hour)}[0],
		},
		{
			ID: uuid.New(), ScheduleID: s3ID, CrewID: c2ID, BookingID: b3ID,
			Role: "搬运工", Status: models.AssignmentWorking,
			ArrivedAt: &[]time.Time{baseDate.Add(8 * time.Hour)}[0],
		},
	}
	for _, a := range assignments {
		if err := db.Create(&a).Error; err != nil {
			log.Printf("Failed to create assignment for crew %s: %v", a.CrewID, err)
		}
	}
	log.Println("Created 5 crew assignments")

	notifications := []models.Notification{
		{
			ID: uuid.New(), UserID: dispatcherID,
			Type: models.NotificationSystem,
			Title: "系统启动完成",
			Content: "搬家公司管理系统已成功启动，所有数据初始化完成。",
		},
		{
			ID: uuid.New(), UserID: dispatcherID,
			Type: models.NotificationSchedule,
			Title: "新排班待确认",
			Content: "陈女士的搬家订单已创建排班，请确认并派工。",
			RelatedID: &s2ID,
		},
	}
	for _, n := range notifications {
		if err := db.Create(&n).Error; err != nil {
			log.Printf("Failed to create notification: %v", err)
		}
	}
	log.Println("Created 2 notifications")

	log.Println("Seed data initialization complete!")
}
