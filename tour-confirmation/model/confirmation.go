package model

import "time"

type ConfirmationStatus string

const (
	ConfirmPending   ConfirmationStatus = "pending"
	ConfirmConfirmed ConfirmationStatus = "confirmed"
	ConfirmRejected  ConfirmationStatus = "rejected"
	ConfirmRevised   ConfirmationStatus = "revised"
)

type ConfirmationAttachment struct {
	ID        string `json:"id"`
	FileName  string `json:"file_name"`
	FileSize  int64  `json:"file_size"`
	MimeType  string `json:"mime_type"`
	UploadURL string `json:"upload_url"`
}

type ConfirmationMaterial struct {
	Category    string                   `json:"category"`
	Title       string                   `json:"title"`
	Description string                   `json:"description"`
	Attachments []ConfirmationAttachment `json:"attachments,omitempty"`
}

type ConfirmationNote struct {
	ID        string    `json:"id"`
	AuthorID  string    `json:"author_id"`
	AuthorName string  `json:"author_name"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type ResourceConfirmation struct {
	ID               string               `json:"id"`
	ItineraryID      string               `json:"itinerary_id"`
	ItinerarySummary *ItinerarySummary    `json:"itinerary_summary,omitempty"`
	ResourceType     string               `json:"resource_type"`
	ResourceName     string               `json:"resource_name"`
	ResourceRef      string               `json:"resource_ref"`
	Materials        []ConfirmationMaterial `json:"materials"`
	Notes            []ConfirmationNote   `json:"notes"`
	PrevConclusion   string               `json:"prev_conclusion,omitempty"`
	Status           ConfirmationStatus   `json:"status"`
	HandlerID        string               `json:"handler_id"`
	HandlerName      string               `json:"handler_name"`
	CreatedAt        time.Time           `json:"created_at"`
	UpdatedAt        time.Time           `json:"updated_at"`
}

type UnconfirmedResource struct {
	ID           string             `json:"id"`
	ResourceType string             `json:"resource_type"`
	ResourceName string             `json:"resource_name"`
	ResourceRef  string             `json:"resource_ref"`
	Status       ConfirmationStatus `json:"status"`
}

type ConfirmationProgress struct {
	PendingCount      int                   `json:"pending_count"`
	ConfirmedCount    int                   `json:"confirmed_count"`
	RejectedCount     int                   `json:"rejected_count"`
	RevisedCount      int                   `json:"revised_count"`
	UnconfirmedList   []UnconfirmedResource `json:"unconfirmed_list"`
	LatestRejectReason string              `json:"latest_reject_reason,omitempty"`
	LastRemindedAt    *time.Time           `json:"last_reminded_at,omitempty"`
}

type ItinerarySummary struct {
	TeamName     string `json:"team_name"`
	TeamCode     string `json:"team_code"`
	StartDate    string `json:"start_date"`
	EndDate      string `json:"end_date"`
	RouteSummary string `json:"route_summary"`
}
