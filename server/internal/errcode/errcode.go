package errcode

import "net/http"

type ErrorCode struct {
	Code       int    `json:"code"`
	Message    string `json:"message"`
	HTTPStatus int    `json:"-"`
}

func (e ErrorCode) Error() string {
	return e.Message
}

var (
	Success = ErrorCode{Code: 0, Message: "success", HTTPStatus: http.StatusOK}

	ErrInvalidParams = ErrorCode{Code: 10001, Message: "invalid parameters", HTTPStatus: http.StatusBadRequest}
	ErrUnauthorized  = ErrorCode{Code: 10002, Message: "unauthorized", HTTPStatus: http.StatusUnauthorized}
	ErrForbidden     = ErrorCode{Code: 10003, Message: "forbidden", HTTPStatus: http.StatusForbidden}
	ErrNotFound      = ErrorCode{Code: 10004, Message: "resource not found", HTTPStatus: http.StatusNotFound}
	ErrInternalError = ErrorCode{Code: 10005, Message: "internal server error", HTTPStatus: http.StatusInternalServerError}
	ErrConflict      = ErrorCode{Code: 10006, Message: "resource conflict", HTTPStatus: http.StatusConflict}

	ErrUserNotFound       = ErrorCode{Code: 20001, Message: "user not found", HTTPStatus: http.StatusNotFound}
	ErrInvalidCredentials = ErrorCode{Code: 20002, Message: "invalid username or password", HTTPStatus: http.StatusUnauthorized}
	ErrUsernameExists     = ErrorCode{Code: 20003, Message: "username already exists", HTTPStatus: http.StatusConflict}

	ErrPurchaseOrderNotFound = ErrorCode{Code: 30001, Message: "purchase order not found", HTTPStatus: http.StatusNotFound}
	ErrPurchaseOrderStatus   = ErrorCode{Code: 30002, Message: "invalid purchase order status for this operation", HTTPStatus: http.StatusBadRequest}
	ErrOrderNoExists         = ErrorCode{Code: 30003, Message: "order number already exists", HTTPStatus: http.StatusConflict}

	ErrRequisitionNotFound = ErrorCode{Code: 40001, Message: "requisition not found", HTTPStatus: http.StatusNotFound}
	ErrRequisitionStatus   = ErrorCode{Code: 40002, Message: "invalid requisition status for this operation", HTTPStatus: http.StatusBadRequest}
	ErrRequisitionNoExists = ErrorCode{Code: 40003, Message: "requisition number already exists", HTTPStatus: http.StatusConflict}
	ErrPurchaseNotReceived = ErrorCode{Code: 40004, Message: "purchase order not received yet", HTTPStatus: http.StatusBadRequest}
	ErrInsufficientStock   = ErrorCode{Code: 40005, Message: "insufficient stock for requisition", HTTPStatus: http.StatusBadRequest}

	ErrAllergenReviewNotFound = ErrorCode{Code: 50001, Message: "allergen review not found", HTTPStatus: http.StatusNotFound}
	ErrAllergenReviewStatus   = ErrorCode{Code: 50002, Message: "invalid allergen review status for this operation", HTTPStatus: http.StatusBadRequest}
	ErrAllergenReviewExists   = ErrorCode{Code: 50003, Message: "allergen review already exists for this requisition", HTTPStatus: http.StatusConflict}
	ErrNotRequisitionOwner    = ErrorCode{Code: 50004, Message: "only production foreman who picked can initiate allergen review", HTTPStatus: http.StatusForbidden}

	ErrRolePermission = ErrorCode{Code: 60001, Message: "insufficient role permissions", HTTPStatus: http.StatusForbidden}
	ErrInvalidRole    = ErrorCode{Code: 60002, Message: "invalid role", HTTPStatus: http.StatusBadRequest}
)
