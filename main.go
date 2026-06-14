package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	if err := InitDB(); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	fmt.Println("[OK] 数据库初始化完成，种子数据已载入（3条样例流程）")

	app := fiber.New(fiber.Config{
		AppName:      "司法鉴定-排期与补样通知系统",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(500).JSON(Resp{Code: 500, Msg: err.Error()})
		},
	})
	app.Use(cors.New())

	api := app.Group("/api")

	api.Get("/users", ListUsers)

	api.Get("/todo", GetTodoList)

	api.Get("/records", ListRecords)
	api.Get("/record/:id", GetRecordDetail)

	api.Post("/schedule", HandleSchedule)

	api.Post("/status", HandleStatusChange)

	api.Post("/supplement/issue", IssueSupplement)
	api.Post("/supplement/complete", CompleteSupplement)
	api.Get("/supplement", ListSupplements)

	fmt.Println("")
	fmt.Println("=== API 接口清单 ===")
	fmt.Println("  GET  /api/users                          人员列表（账号用于接口调用）")
	fmt.Println("  GET  /api/todo?role=clerk|expert|qc      按角色待办")
	fmt.Println("  GET  /api/records                        案件列表（可选status/case_no过滤）")
	fmt.Println("  GET  /api/record/:id                     案件详情（排期+补样+状态链+备注链）")
	fmt.Println("  POST /api/schedule                       受理员排期/重排期")
	fmt.Println("  POST /api/status                         状态变更（开始鉴定/提交质控/质控通过归档/质控退回）")
	fmt.Println("  POST /api/supplement/issue               鉴定人发起补样通知（自动承接排期备注）")
	fmt.Println("  POST /api/supplement/complete            受理员补样完成（自动流转待重排期）")
	fmt.Println("  GET  /api/supplement?record_id=xxx       补样通知回看（按案件）")
	fmt.Println("  GET  /api/supplement?status=pending      补样通知列表（全局过滤）")
	fmt.Println("")
	fmt.Println("  账号对照：")
	fmt.Println("    clerk_li     李受理（受理员）")
	fmt.Println("    expert_zhang 张鉴定（鉴定人）")
	fmt.Println("    expert_wang  王法医（鉴定人）")
	fmt.Println("    qc_zhao      赵质控（质控审核）")
	fmt.Println("")

	port := ":8080"
	fmt.Printf("[启动] 服务监听 %s ...\n", port)
	log.Fatal(app.Listen(port))
}
