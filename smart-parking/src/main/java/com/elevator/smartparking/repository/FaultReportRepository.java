package com.elevator.smartparking.repository;

import com.elevator.smartparking.entity.FaultReport;
import com.elevator.smartparking.entity.FaultStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaultReportRepository extends JpaRepository<FaultReport, Long> {
    Optional<FaultReport> findByReportNo(String reportNo);
    List<FaultReport> findByElevatorIdOrderByCreateTimeDesc(Long elevatorId);
    List<FaultReport> findByStatusOrderByCreateTimeDesc(FaultStatus status);
    List<FaultReport> findByHandlerIdOrderByCreateTimeDesc(Long handlerId);
    List<FaultReport> findByStatusInAndHandlerIdOrderByCreateTimeDesc(List<FaultStatus> statuses, Long handlerId);
    List<FaultReport> findByStatusInOrderByCreateTimeDesc(List<FaultStatus> statuses);
}
