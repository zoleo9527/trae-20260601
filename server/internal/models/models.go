package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleProcurementManager Role = "procurement_manager"
	RoleProductionForeman  Role = "production_foreman"
	RoleStoreSupervisor    Role = "store_supervisor"
)

type User struct {
	ID           uuid.UUID `gorm:"primaryKey;type:uuid" json:"id"`
	Username     string    `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Name         string    `gorm:"not null" json:"name"`
	Role         Role      `gorm:"not null" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type PurchaseStatus string

const (
	PurchaseStatusDraft      PurchaseStatus = "draft"
	PurchaseStatusApproved   PurchaseStatus = "approved"
	PurchaseStatusInTransit  PurchaseStatus = "in_transit"
	PurchaseStatusReceived   PurchaseStatus = "received"
	PurchaseStatusRejected   PurchaseStatus = "rejected"
)

type PurchaseOrder struct {
	ID              uuid.UUID      `gorm:"primaryKey;type:uuid" json:"id"`
	OrderNo         string         `gorm:"uniqueIndex;not null" json:"order_no"`
	SupplierName    string         `gorm:"not null" json:"supplier_name"`
	TotalAmount     float64        `gorm:"not null" json:"total_amount"`
	Status          PurchaseStatus `gorm:"not null" json:"status"`
	ExpectedDate    time.Time      `json:"expected_date"`
	ReceivedDate    *time.Time     `json:"received_date,omitempty"`
	CreatedBy       uuid.UUID      `gorm:"not null" json:"created_by"`
	CreatedByUser   *User          `gorm:"foreignKey:CreatedBy" json:"created_by_user,omitempty"`
	Items           []PurchaseItem `json:"items,omitempty"`
	Requisition     *Requisition   `gorm:"foreignKey:PurchaseOrderID" json:"requisition,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

func (p *PurchaseOrder) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type PurchaseItem struct {
	ID              uuid.UUID `gorm:"primaryKey;type:uuid" json:"id"`
	PurchaseOrderID uuid.UUID `gorm:"not null;index" json:"purchase_order_id"`
	MaterialName    string    `gorm:"not null" json:"material_name"`
	SKU             string    `json:"sku"`
	Quantity        float64   `gorm:"not null" json:"quantity"`
	Unit            string    `gorm:"not null" json:"unit"`
	UnitPrice       float64   `gorm:"not null" json:"unit_price"`
	AllergenInfo    string    `json:"allergen_info"`
	BatchNo         string    `json:"batch_no"`
	ExpiryDate      *time.Time `json:"expiry_date,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (pi *PurchaseItem) BeforeCreate(tx *gorm.DB) error {
	if pi.ID == uuid.Nil {
		pi.ID = uuid.New()
	}
	return nil
}

type RequisitionStatus string

const (
	RequisitionStatusPending         RequisitionStatus = "pending"
	RequisitionStatusPicked          RequisitionStatus = "picked"
	RequisitionStatusAllergenPending RequisitionStatus = "allergen_pending"
	RequisitionStatusAllergenPassed  RequisitionStatus = "allergen_passed"
	RequisitionStatusAllergenFailed  RequisitionStatus = "allergen_failed"
	RequisitionStatusCompleted       RequisitionStatus = "completed"
	RequisitionStatusCancelled       RequisitionStatus = "cancelled"
)

type Requisition struct {
	ID                uuid.UUID         `gorm:"primaryKey;type:uuid" json:"id"`
	RequisitionNo     string            `gorm:"uniqueIndex;not null" json:"requisition_no"`
	PurchaseOrderID   uuid.UUID         `gorm:"not null;index" json:"purchase_order_id"`
	PurchaseOrder     *PurchaseOrder    `gorm:"foreignKey:PurchaseOrderID" json:"purchase_order,omitempty"`
	ProductionLine    string            `gorm:"not null" json:"production_line"`
	Status            RequisitionStatus `gorm:"not null" json:"status"`
	PickedBy          *uuid.UUID        `gorm:"index" json:"picked_by,omitempty"`
	PickedByUser      *User             `gorm:"foreignKey:PickedBy" json:"picked_by_user,omitempty"`
	PickedAt          *time.Time        `json:"picked_at,omitempty"`
	AllergenCheckedBy *uuid.UUID        `gorm:"index" json:"allergen_checked_by,omitempty"`
	AllergenChecker   *User             `gorm:"foreignKey:AllergenCheckedBy" json:"allergen_checker_user,omitempty"`
	AllergenCheckedAt *time.Time        `json:"allergen_checked_at,omitempty"`
	StoreVerifiedBy   *uuid.UUID        `gorm:"index" json:"store_verified_by,omitempty"`
	StoreVerifier     *User             `gorm:"foreignKey:StoreVerifiedBy" json:"store_verifier_user,omitempty"`
	StoreVerifiedAt   *time.Time        `json:"store_verified_at,omitempty"`
	Items             []RequisitionItem `json:"items,omitempty"`
	AllergenReview    *AllergenReview   `gorm:"foreignKey:RequisitionID" json:"allergen_review,omitempty"`
	Remarks           string            `json:"remarks"`
	CreatedAt         time.Time         `json:"created_at"`
	UpdatedAt         time.Time         `json:"updated_at"`
}

func (r *Requisition) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

type RequisitionItem struct {
	ID            uuid.UUID `gorm:"primaryKey;type:uuid" json:"id"`
	RequisitionID uuid.UUID `gorm:"not null;index" json:"requisition_id"`
	PurchaseItemID uuid.UUID `gorm:"not null;index" json:"purchase_item_id"`
	PurchaseItem  *PurchaseItem `gorm:"foreignKey:PurchaseItemID" json:"purchase_item,omitempty"`
	MaterialName  string    `gorm:"not null" json:"material_name"`
	RequestedQty  float64   `gorm:"not null" json:"requested_qty"`
	PickedQty     float64   `json:"picked_qty"`
	Unit          string    `gorm:"not null" json:"unit"`
	AllergenInfo  string    `json:"allergen_info"`
	BatchNo       string    `json:"batch_no"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (ri *RequisitionItem) BeforeCreate(tx *gorm.DB) error {
	if ri.ID == uuid.Nil {
		ri.ID = uuid.New()
	}
	return nil
}

type AllergenReviewStatus string

const (
	AllergenStatusPending   AllergenReviewStatus = "pending"
	AllergenStatusReviewing AllergenReviewStatus = "reviewing"
	AllergenStatusPassed    AllergenReviewStatus = "passed"
	AllergenStatusFailed    AllergenReviewStatus = "failed"
)

type AllergenReview struct {
	ID            uuid.UUID            `gorm:"primaryKey;type:uuid" json:"id"`
	RequisitionID uuid.UUID            `gorm:"not null;uniqueIndex" json:"requisition_id"`
	Requisition   *Requisition         `gorm:"foreignKey:RequisitionID" json:"requisition,omitempty"`
	Status        AllergenReviewStatus `gorm:"not null" json:"status"`
	CheckedBy     uuid.UUID            `gorm:"not null" json:"checked_by"`
	CheckedByUser *User                `gorm:"foreignKey:CheckedBy" json:"checked_by_user,omitempty"`
	CheckItems    []AllergenCheckItem  `json:"check_items,omitempty"`
	OverallResult string               `json:"overall_result"`
	Findings      string               `json:"findings"`
	CorrectiveActions string           `json:"corrective_actions"`
	VerifiedBy    *uuid.UUID           `gorm:"index" json:"verified_by,omitempty"`
	VerifiedByUser *User               `gorm:"foreignKey:VerifiedBy" json:"verified_by_user,omitempty"`
	VerifiedAt    *time.Time           `json:"verified_at,omitempty"`
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
}

func (ar *AllergenReview) BeforeCreate(tx *gorm.DB) error {
	if ar.ID == uuid.Nil {
		ar.ID = uuid.New()
	}
	return nil
}

type AllergenCheckItem struct {
	ID               uuid.UUID `gorm:"primaryKey;type:uuid" json:"id"`
	AllergenReviewID uuid.UUID `gorm:"not null;index" json:"allergen_review_id"`
	RequisitionItemID uuid.UUID `gorm:"not null;index" json:"requisition_item_id"`
	MaterialName     string    `gorm:"not null" json:"material_name"`
	AllergenType     string    `gorm:"not null" json:"allergen_type"`
	IsContained      bool      `gorm:"not null" json:"is_contained"`
	LabelVerified    bool      `gorm:"not null" json:"label_verified"`
	BatchVerified    bool      `gorm:"not null" json:"batch_verified"`
	CrossContaminationRisk string `json:"cross_contamination_risk"`
	Remarks          string    `json:"remarks"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (aci *AllergenCheckItem) BeforeCreate(tx *gorm.DB) error {
	if aci.ID == uuid.Nil {
		aci.ID = uuid.New()
	}
	return nil
}

type ActionType string

const (
	ActionTypeCreate     ActionType = "create"
	ActionTypeUpdate     ActionType = "update"
	ActionTypeStatusChange ActionType = "status_change"
	ActionTypeSubmit     ActionType = "submit"
	ActionTypeApprove    ActionType = "approve"
	ActionTypeReject     ActionType = "reject"
	ActionTypePick       ActionType = "pick"
	ActionTypeVerify     ActionType = "verify"
	ActionTypeReview     ActionType = "review"
	ActionTypeComment    ActionType = "comment"
)

type ActionLog struct {
	ID         uuid.UUID  `gorm:"primaryKey;type:uuid" json:"id"`
	ResourceID uuid.UUID  `gorm:"not null;index" json:"resource_id"`
	ResourceType string   `gorm:"not null;index" json:"resource_type"`
	ActionType ActionType `gorm:"not null" json:"action_type"`
	ActionName string     `gorm:"not null" json:"action_name"`
	Description string    `json:"description"`
	OldStatus  string     `json:"old_status"`
	NewStatus  string     `json:"new_status"`
	PerformedBy uuid.UUID `gorm:"not null" json:"performed_by"`
	PerformedByUser *User `gorm:"foreignKey:PerformedBy" json:"performed_by_user,omitempty"`
	Metadata   string     `gorm:"type:text" json:"metadata"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (al *ActionLog) BeforeCreate(tx *gorm.DB) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	return nil
}
