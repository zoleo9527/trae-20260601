package middleware

import (
	"meat-inspection-system/database"
	"meat-inspection-system/models"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var JWTSecret = []byte("meat-inspection-system-secret-key")

func AuthRequired(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "未提供认证令牌"})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(401).JSON(fiber.Map{"error": "认证令牌格式错误"})
	}

	tokenStr := parts[1]
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "无效的认证令牌"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "令牌解析失败"})
	}

	userID := uint(claims["user_id"].(float64))
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "用户不存在"})
	}

	c.Locals("user", &user)
	return c.Next()
}

func GetCurrentUser(c *fiber.Ctx) *models.User {
	user, ok := c.Locals("user").(*models.User)
	if !ok {
		return nil
	}
	return user
}

func IdempotencyCheck(c *fiber.Ctx) error {
	key := c.Get("X-Idempotency-Key")
	if key == "" {
		return c.Next()
	}

	var record models.IdempotencyRecord
	if err := database.DB.Where("key = ?", key).First(&record).Error; err == nil {
		c.Set("X-Idempotency-Hit", "true")
		c.Set("Content-Type", record.ContentType)
		return c.Status(record.StatusCode).SendString(record.ResponseJSON)
	}

	c.Locals("idempotency_key", key)
	return c.Next()
}

func SaveIdempotencyResponse(c *fiber.Ctx, response []byte) {
	key, ok := c.Locals("idempotency_key").(string)
	if !ok || key == "" {
		return
	}

	statusCode := c.Response().StatusCode()
	contentType := string(c.Response().Header.ContentType())
	if contentType == "" {
		contentType = "application/json"
	}

	record := models.IdempotencyRecord{
		Key:          key,
		StatusCode:   statusCode,
		ContentType:  contentType,
		ResponseJSON: string(response),
	}
	database.DB.Create(&record)
}
