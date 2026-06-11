package com.elevator.maintenance.repository;

import com.elevator.maintenance.entity.CheckInRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CheckInRecordRepository extends JpaRepository<CheckInRecord, Long> {
    List<CheckInRecord> findByPlanId(Long planId);
    List<CheckInRecord> findByTechnicianId(Long technicianId);
    List<CheckInRecord> findByElevatorId(Long elevatorId);
    Optional<CheckInRecord> findTopByPlanIdOrderByCheckInTimeDesc(Long planId);
    Optional<CheckInRecord> findTopByPlanIdAndCheckOutTimeIsNullOrderByCheckInTimeDesc(Long planId);
}
