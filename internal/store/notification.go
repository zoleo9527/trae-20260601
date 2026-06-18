package store

import (
	"fmt"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateNotification(title, content string, targetRole models.Role, targetUser string, relatedType, relatedID string) *models.Notification {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.createNotificationLocked(title, content, targetRole, targetUser, relatedType, relatedID)
}

func (s *Store) createNotificationLocked(title, content string, targetRole models.Role, targetUser string, relatedType, relatedID string) *models.Notification {
	s.notificationSeq++
	id := fmt.Sprintf("NF%06d", s.notificationSeq)

	now := time.Now()
	notification := models.Notification{
		ID:          id,
		Title:       title,
		Content:     content,
		TargetRole:  targetRole,
		TargetUser:  targetUser,
		RelatedType: relatedType,
		RelatedID:   relatedID,
		Status:      models.NotificationUnread,
		CreatedAt:   now,
	}

	s.notifications[id] = notification
	return &notification
}

func (s *Store) ListNotificationsByRole(role models.Role) []models.Notification {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []models.Notification
	for _, n := range s.notifications {
		if n.TargetRole == role {
			result = append(result, n)
		}
	}
	return result
}

func (s *Store) ListNotificationsByUser(user string) []models.Notification {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []models.Notification
	for _, n := range s.notifications {
		if n.TargetUser == user {
			result = append(result, n)
		}
	}
	return result
}

func (s *Store) ListAllNotifications() []models.Notification {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]models.Notification, 0, len(s.notifications))
	for _, n := range s.notifications {
		result = append(result, n)
	}
	return result
}

func (s *Store) MarkNotificationRead(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	n, exists := s.notifications[id]
	if !exists {
		return false
	}
	now := time.Now()
	n.Status = models.NotificationRead
	n.ReadAt = &now
	s.notifications[id] = n
	return true
}
