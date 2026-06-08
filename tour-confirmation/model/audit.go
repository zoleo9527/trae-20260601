package model

import "time"

type AuditAction string

const (
	ActionItinCreate    AuditAction = "itinerary_create"
	ActionItinUpdate    AuditAction = "itinerary_update"
	ActionItinSubmit    AuditAction = "itinerary_submit"
	ActionItinWithdraw  AuditAction = "itinerary_withdraw"
	ActionConfirmCreate  AuditAction = "confirmation_create"
	ActionConfirmConfirm AuditAction = "confirmation_confirm"
	ActionConfirmReject  AuditAction = "confirmation_reject"
	ActionConfirmRevise  AuditAction = "confirmation_revise"
	ActionConfirmNote    AuditAction = "confirmation_note"
	ActionConfirmMaterial AuditAction = "confirmation_material"
	ActionConfirmRemind  AuditAction = "confirm_remind"
	ActionExportCreate   AuditAction = "export_create"
)

type AuditLog struct {
	ID         string      `json:"id"`
	EntityType string      `json:"entity_type"`
	EntityID   string      `json:"entity_id"`
	Action     AuditAction `json:"action"`
	OperatorID string      `json:"operator_id"`
	OperatorName string    `json:"operator_name"`
	Detail     string      `json:"detail,omitempty"`
	Snapshot   string      `json:"snapshot,omitempty"`
	CreatedAt  time.Time   `json:"created_at"`
}
