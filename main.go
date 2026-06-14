package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	InitDB()
	r := gin.Default()

	r.Static("/static", "./static")
	r.StaticFile("/", "./static/index.html")

	api := r.Group("/api")
	{
		api.GET("/users", ListUsers)
		api.GET("/stores", ListStores)

		api.GET("/shifts", ListShiftSettlements)
		api.GET("/shifts/:id", GetShiftSettlement)
		api.POST("/shifts", CreateShiftSettlement)
		api.POST("/shifts/:id/:action", UpdateShiftStatus)

		api.GET("/cash", ListCashVerifications)
		api.GET("/cash/:id", GetCashVerification)
		api.POST("/cash/:id/:action", UpdateCashVerification)
		api.POST("/cash/:id/materials", AddMaterial)

		api.GET("/logs", GetOperationLogs)

		api.GET("/notifications", ListNotifications)
		api.POST("/notifications/:id/read", ReadNotification)
		api.GET("/notifications/unread", UnreadCount)
	}

	log.Println("Server starting at http://localhost:8080")
	log.Println("测试账号（Header: X-User-ID）:")
	log.Println("  1 - 王小明（店员，朝阳店）")
	log.Println("  2 - 李小红（店员，朝阳店）")
	log.Println("  3 - 张店长（店长，朝阳店）【默认】")
	log.Println("  4 - 赵片区（片区管理员）")
	log.Println("  5 - 陈小刚（店员，中关村店）")
	log.Println("  6 - 孙店长（店长，中关村店）")
	if err := r.Run(":8080"); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
