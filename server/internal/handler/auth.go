package handler

import (
	"central-kitchen/internal/database"
	"central-kitchen/internal/errcode"
	"central-kitchen/internal/middleware"
	"central-kitchen/internal/models"
	"central-kitchen/internal/utils/response"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, errcode.ErrInvalidParams)
	}

	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return response.Error(c, errcode.ErrInvalidCredentials)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return response.Error(c, errcode.ErrInvalidCredentials)
	}

	token, err := middleware.GenerateToken(&user)
	if err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, LoginResponse{
		Token: token,
		User:  user,
	})
}

func GetCurrentUser(c *fiber.Ctx) error {
	userID, role := middleware.GetCurrentUser(c)

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		return response.Error(c, errcode.ErrUserNotFound)
	}

	return response.Success(c, fiber.Map{
		"user": user,
		"role": role,
	})
}

func GetUsers(c *fiber.Ctx) error {
	var users []models.User
	if err := database.DB.Find(&users).Error; err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}
	return response.Success(c, users)
}
