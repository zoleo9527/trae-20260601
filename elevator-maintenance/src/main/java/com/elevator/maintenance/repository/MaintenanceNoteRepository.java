package com.elevator.maintenance.repository;

import com.elevator.maintenance.entity.MaintenanceNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceNoteRepository extends JpaRepository<MaintenanceNote, Long> {
    List<MaintenanceNote> findByPlanIdOrderByCreateTimeDesc(Long planId);
    List<MaintenanceNote> findByOperatorId(Long operatorId);
}
