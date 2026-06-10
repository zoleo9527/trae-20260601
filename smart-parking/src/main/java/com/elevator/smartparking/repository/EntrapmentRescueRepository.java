package com.elevator.smartparking.repository;

import com.elevator.smartparking.entity.EntrapmentRescue;
import com.elevator.smartparking.entity.RescueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntrapmentRescueRepository extends JpaRepository<EntrapmentRescue, Long> {
    Optional<EntrapmentRescue> findByRescueNo(String rescueNo);
    List<EntrapmentRescue> findByElevatorIdOrderByCreateTimeDesc(Long elevatorId);
    List<EntrapmentRescue> findByStatusOrderByCreateTimeDesc(RescueStatus status);
    List<EntrapmentRescue> findByFaultReportIdOrderByCreateTimeDesc(Long faultReportId);
    Optional<EntrapmentRescue> findTopByFaultReportIdOrderByCreateTimeDesc(Long faultReportId);
    List<EntrapmentRescue> findByStatusInAndRescuerIdOrderByCreateTimeDesc(List<RescueStatus> statuses, Long rescuerId);
    List<EntrapmentRescue> findByStatusInOrderByCreateTimeDesc(List<RescueStatus> statuses);
}
