package response

import (
	"central-kitchen/internal/errcode"

	"github.com/gofiber/fiber/v2"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Success(c *fiber.Ctx, data ...interface{}) error {
	resp := Response{
		Code:    errcode.Success.Code,
		Message: errcode.Success.Message,
	}
	if len(data) > 0 {
		resp.Data = data[0]
	}
	return c.Status(errcode.Success.HTTPStatus).JSON(resp)
}

func Error(c *fiber.Ctx, err errcode.ErrorCode, details ...string) error {
	resp := Response{
		Code:    err.Code,
		Message: err.Message,
	}
	if len(details) > 0 {
		resp.Message = details[0]
	}
	return c.Status(err.HTTPStatus).JSON(resp)
}

func ErrorWithData(c *fiber.Ctx, err errcode.ErrorCode, data interface{}, details ...string) error {
	resp := Response{
		Code:    err.Code,
		Message: err.Message,
		Data:    data,
	}
	if len(details) > 0 {
		resp.Message = details[0]
	}
	return c.Status(err.HTTPStatus).JSON(resp)
}
