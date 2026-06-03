package middleware

import (
	"central-kitchen/internal/errcode"
	"central-kitchen/internal/models"
	"central-kitchen/internal/utils/response"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var jwtSecret = []byte("central-kitchen-secret-key-2026")

type Claims struct {
	UserID   uuid.UUID   `json:"user_id"`
	Username string      `json:"username"`
	Role     models.Role `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(user *models.User) (string, error) {
	claims := Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "central-kitchen",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.Error(c, errcode.ErrUnauthorized)
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return response.Error(c, errcode.ErrUnauthorized, "invalid authorization format")
		}

		tokenStr := parts[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			return response.Error(c, errcode.ErrUnauthorized, "invalid or expired token")
		}

		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}

func RoleRequired(roles ...models.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, ok := c.Locals("role").(models.Role)
		if !ok {
			return response.Error(c, errcode.ErrUnauthorized)
		}

		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}

		return response.Error(c, errcode.ErrRolePermission)
	}
}

func GetCurrentUser(c *fiber.Ctx) (uuid.UUID, models.Role) {
	userID, _ := c.Locals("userID").(uuid.UUID)
	role, _ := c.Locals("role").(models.Role)
	return userID, role
}
