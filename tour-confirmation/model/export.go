package model

import "time"

type ExportType string

const (
	ExportItinerary    ExportType = "itinerary"
	ExportConfirmation ExportType = "confirmation"
)

type ExportFormat string

const (
	ExportPDF  ExportFormat = "pdf"
	ExportXLSX ExportFormat = "xlsx"
)

type ExportStatus string

const (
	ExportPending   ExportStatus = "pending"
	ExportRunning   ExportStatus = "running"
	ExportCompleted ExportStatus = "completed"
	ExportFailed    ExportStatus = "failed"
)

type ExportTask struct {
	ID               string       `json:"id"`
	Type             ExportType   `json:"type"`
	Format           ExportFormat `json:"format"`
	SourceID         string       `json:"source_id"`
	Status           ExportStatus `json:"status"`
	DownloadURL      string       `json:"download_url,omitempty"`
	ErrorMessage     string       `json:"error_message,omitempty"`
	AttachmentIDs    []string     `json:"attachment_ids,omitempty"`
	RequestedBy      string       `json:"requested_by"`
	RequestedByName  string       `json:"requested_by_name"`
	CreatedAt        time.Time    `json:"created_at"`
	CompletedAt      *time.Time   `json:"completed_at,omitempty"`
}
