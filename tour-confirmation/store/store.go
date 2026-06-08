package store

import (
	"sync"
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

func (s *Store) ListItineraries(status model.ItineraryStatus, offset, limit int) ([]*model.Itinerary, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var filtered []*model.Itinerary
	for _, it := range s.itineraries {
		if status == "" || it.Status == status {
			filtered = append(filtered, it)
		}
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

func (s *Store) ListConfirmations(itineraryID string, status model.ConfirmationStatus, offset, limit int) ([]*model.ResourceConfirmation, int) {
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
