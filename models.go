package main

import "time"

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	StoreID  *int   `json:"store_id"`
	AreaID   *int   `json:"area_id"`
}

type Store struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	AreaID  int    `json:"area_id"`
	Address string `json:"address"`
}

type ShiftSettlement struct {
	ID            int        `json:"id"`
	StoreID       int        `json:"store_id"`
	StoreName     string     `json:"store_name,omitempty"`
	ShiftNo       string     `json:"shift_no"`
	ClerkID       int        `json:"clerk_id"`
	ClerkName     string     `json:"clerk_name,omitempty"`
	ShiftDate     string     `json:"shift_date"`
	ShiftType     string     `json:"shift_type"`
	TicketSales   float64    `json:"ticket_sales"`
	ScratchSales  float64    `json:"scratch_sales"`
	TotalSales    float64    `json:"total_sales"`
	CashExpected  float64    `json:"cash_expected"`
	CashActual    *float64   `json:"cash_actual"`
	Status        string     `json:"status"`
	RejectReason  *string    `json:"reject_reason"`
	CreatedBy     int        `json:"created_by"`
	ApprovedBy    *int       `json:"approved_by"`
	ApprovedByName string    `json:"approved_by_name,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type CashVerification struct {
	ID                int        `json:"id"`
	ShiftSettlementID int        `json:"shift_settlement_id"`
	StoreID           int        `json:"store_id"`
	StoreName         string     `json:"store_name,omitempty"`
	StoreManagerID    *int       `json:"store_manager_id"`
	StoreManagerName  string     `json:"store_manager_name,omitempty"`
	AreaManagerID     *int       `json:"area_manager_id"`
	AreaManagerName   string     `json:"area_manager_name,omitempty"`
	CashDeclared      float64    `json:"cash_declared"`
	CashCounted       *float64   `json:"cash_counted"`
	Difference        *float64   `json:"difference"`
	Status            string     `json:"status"`
	PreviousConclusion *string   `json:"previous_conclusion"`
	MaterialNotes     *string    `json:"material_notes"`
	Notes             *string    `json:"notes"`
	Resolution        *string    `json:"resolution"`
	Materials         []Material `json:"materials,omitempty"`
	ShiftInfo         *ShiftSettlement `json:"shift_info,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type Material struct {
	ID                 int       `json:"id"`
	CashVerificationID int       `json:"cash_verification_id"`
	Type               string    `json:"type"`
	Name               string    `json:"name"`
	Amount             *float64  `json:"amount"`
	ReferenceNo        *string   `json:"reference_no"`
	FileURL            *string   `json:"file_url"`
	UploadedBy         *int      `json:"uploaded_by"`
	UploadedByName     string    `json:"uploaded_by_name,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

type OperationLog struct {
	ID            int       `json:"id"`
	RefType       string    `json:"ref_type"`
	RefID         int       `json:"ref_id"`
	Action        string    `json:"action"`
	OldStatus     *string   `json:"old_status"`
	NewStatus     *string   `json:"new_status"`
	OperatorID    int       `json:"operator_id"`
	OperatorName  string    `json:"operator_name"`
	OperatorRole  string    `json:"operator_role"`
	Detail        *string   `json:"detail"`
	CreatedAt     time.Time `json:"created_at"`
}

type Notification struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	RefType   string    `json:"ref_type"`
	RefID     int       `json:"ref_id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Content   *string   `json:"content"`
	IsRead    int       `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

type ApiResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(data interface{}) ApiResponse {
	return ApiResponse{Code: 0, Message: "ok", Data: data}
}

func Err(code int, msg string) ApiResponse {
	return ApiResponse{Code: code, Message: msg}
}
