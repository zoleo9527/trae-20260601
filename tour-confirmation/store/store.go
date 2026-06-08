package store

import (
	"sync"
	"time"
	"tour-confirmation/model"
)

type Store struct {
	mu             sync.RWMutex
	itineraries    map[string]*model.Itinerary
	confirmations  map[string]*model.ResourceConfirmation
	auditLogs      map[string][]model.AuditLog
	exports        map[string]*model.ExportTask
}

func New() *Store {
	return &Store{
		itineraries:   make(map[string]*model.Itinerary),
		confirmations: make(map[string]*model.ResourceConfirmation),
		auditLogs:     make(map[string][]model.AuditLog),
		exports:       make(map[string]*model.ExportTask),
	}
}

func (s *Store) SaveItinerary(itin *model.Itinerary) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.itineraries[itin.ID] = itin
}

func (s *Store) GetItinerary(id string) (*model.Itinerary, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	it, ok := s.itineraries[id]
	return it, ok
}

func (s *Store) ListItineraries(status model.ItineraryStatus, hasPending *bool, offset, limit int) ([]*model.Itinerary, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var filtered []*model.Itinerary
	for _, it := range s.itineraries {
		if status != "" && it.Status != status {
			continue
		}
		if hasPending != nil {
			has := s.itineraryHasPendingLocked(it.ID)
			if *hasPending && !has {
				continue
			}
			if !*hasPending && has {
				continue
			}
		}
		filtered = append(filtered, it)
	}
	total := len(filtered)
	if offset >= total {
		return nil, total
	}
	end := offset + limit
	if end > total {
		end = total
	}
	return filtered[offset:end], total
}

func (s *Store) itineraryHasPendingLocked(itineraryID string) bool {
	for _, c := range s.confirmations {
		if c.ItineraryID == itineraryID {
			if c.Status == model.ConfirmPending || c.Status == model.ConfirmRevised {
				return true
			}
		}
	}
	return false
}

func (s *Store) ItineraryHasPendingConfirmations(itineraryID string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.itineraryHasPendingLocked(itineraryID)
}

func (s *Store) SaveConfirmation(c *model.ResourceConfirmation) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.confirmations[c.ID] = c
}

func (s *Store) GetConfirmation(id string) (*model.ResourceConfirmation, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, ok := s.confirmations[id]
	return c, ok
}

func (s *Store) ListConfirmations(itineraryID string, status model.ConfirmationStatus, resourceType string, createdFrom, createdTo *time.Time, offset, limit int) ([]*model.ResourceConfirmation, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var filtered []*model.ResourceConfirmation
	for _, c := range s.confirmations {
		if itineraryID != "" && c.ItineraryID != itineraryID {
			continue
		}
		if status != "" && c.Status != status {
			continue
		}
		if resourceType != "" && c.ResourceType != resourceType {
			continue
		}
		if createdFrom != nil && c.CreatedAt.Before(*createdFrom) {
			continue
		}
		if createdTo != nil && c.CreatedAt.After(*createdTo) {
			continue
		}
		filtered = append(filtered, c)
	}
	total := len(filtered)
	if offset >= total {
		return nil, total
	}
	end := offset + limit
	if end > total {
		end = total
	}
	return filtered[offset:end], total
}

func (s *Store) ListConfirmationsByItinerary(itineraryID string) []*model.ResourceConfirmation {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []*model.ResourceConfirmation
	for _, c := range s.confirmations {
		if c.ItineraryID == itineraryID {
			result = append(result, c)
		}
	}
	return result
}

func (s *Store) AppendAudit(log model.AuditLog) {
	s.mu.Lock()
	defer s.mu.Unlock()
	key := log.EntityType + ":" + log.EntityID
	s.auditLogs[key] = append(s.auditLogs[key], log)
}

func (s *Store) ListAudit(entityType, entityID string) []model.AuditLog {
	s.mu.RLock()
	defer s.mu.RUnlock()
	key := entityType + ":" + entityID
	return s.auditLogs[key]
}

func (s *Store) SaveExport(t *model.ExportTask) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.exports[t.ID] = t
}

func (s *Store) GetExport(id string) (*model.ExportTask, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	t, ok := s.exports[id]
	return t, ok
}

func (s *Store) GetItineraryByIDForSummary(id string) (*model.Itinerary, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	it, ok := s.itineraries[id]
	return it, ok
}
