package model

type ErrorCode int

const (
	ErrOK                  ErrorCode = 0
	ErrBadRequest          ErrorCode = 40000
	ErrUnauthorized        ErrorCode = 40100
	ErrForbidden           ErrorCode = 40300
	ErrNotFound            ErrorCode = 40400
	ErrConflict            ErrorCode = 40900
	ErrItineraryNotFound  ErrorCode = 40401
	ErrItineraryNotDraft  ErrorCode = 40901
	ErrItineraryNotSubmit ErrorCode = 40902
	ErrConfirmNotFound     ErrorCode = 40402
	ErrConfirmNotPending   ErrorCode = 40903
	ErrExportNotFound      ErrorCode = 40403
	ErrExportFailed        ErrorCode = 50001
	ErrInternal            ErrorCode = 50000
)

var errorCodeMessages = map[ErrorCode]string{
	ErrOK:                  "success",
	ErrBadRequest:          "请求参数错误",
	ErrUnauthorized:        "未授权",
	ErrForbidden:           "无权限",
	ErrNotFound:            "资源不存在",
	ErrConflict:            "状态冲突",
	ErrItineraryNotFound:  "行程不存在",
	ErrItineraryNotDraft:  "行程非草稿状态，不可修改",
	ErrItineraryNotSubmit: "行程非已提交状态，不可撤回",
	ErrConfirmNotFound:    "资源确认不存在",
	ErrConfirmNotPending:  "资源确认非待确认状态",
	ErrExportNotFound:     "导出任务不存在",
	ErrExportFailed:       "导出失败",
	ErrInternal:           "内部错误",
}

func (c ErrorCode) Message() string {
	if msg, ok := errorCodeMessages[c]; ok {
		return msg
	}
	return "未知错误"
}

type Response struct {
	Code    ErrorCode   `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(data interface{}) Response {
	return Response{Code: ErrOK, Message: ErrOK.Message(), Data: data}
}

func Fail(code ErrorCode) Response {
	return Response{Code: code, Message: code.Message()}
}

func FailMsg(code ErrorCode, msg string) Response {
	return Response{Code: code, Message: msg}
}
