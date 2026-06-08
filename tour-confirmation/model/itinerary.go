package model

import "time"

type ItineraryStatus string

const (
	ItineraryDraft     ItineraryStatus = "draft"
	ItinerarySubmitted ItineraryStatus = "submitted"
	ItineraryWithdrawn ItineraryStatus = "withdrawn"
)

type ItineraryItem struct {
	Date        string `json:"date"`
	Activity    string `json:"activity"`
	HotelName   string `json:"hotel_name,omitempty"`
	MealPlan    string `json:"meal_plan,omitempty"`
	Transport   string `json:"transport,omitempty"`
	Remark      string `json:"remark,omitempty"`
}

type Itinerary struct {
	ID            string          `json:"id"`
	TeamName      string          `json:"team_name"`
	TeamCode      string          `json:"team_code"`
	GuideName     string          `json:"guide_name"`
	GuidePhone    string          `json:"guide_phone"`
	Days          int             `json:"days"`
	StartDate     string          `json:"start_date"`
	EndDate       string          `json:"end_date"`
	RouteSummary  string          `json:"route_summary"`
	Items         []ItineraryItem `json:"items"`
	Status        ItineraryStatus `json:"status"`
	CreatorID     string          `json:"creator_id"`
	CreatorName   string          `json:"creator_name"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}
