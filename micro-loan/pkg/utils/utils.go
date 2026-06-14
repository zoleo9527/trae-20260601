package utils

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

func GenerateApplicationNo() string {
	now := time.Now()
	return fmt.Sprintf("LA%s%s", now.Format("20060102"), uuid.New().String()[:8])
}

func GenerateUUID() string {
	return uuid.New().String()
}

func IsValidStatusTransition(from, to string) bool {
	validTransitions := map[string][]string{
		"pending":        {"collecting", "rejected"},
		"collecting":     {"risk_auditing", "rejected"},
		"risk_auditing":  {"approved", "rejected"},
		"approved":       {"disbursed", "rejected"},
		"disbursed":      {"overdue", "settled", "extension"},
		"overdue":        {"extension", "settled", "risk_auditing"},
		"extension":      {"overdue", "settled"},
		"settled":        {},
		"rejected":       {},
	}

	allowed, exists := validTransitions[from]
	if !exists {
		return false
	}

	for _, status := range allowed {
		if status == to {
			return true
		}
	}
	return false
}
