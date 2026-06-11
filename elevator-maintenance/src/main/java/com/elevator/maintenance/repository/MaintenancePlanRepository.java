package com.elevator.maintenance.repository;

import com.elevator.maintenance.entity.MaintenancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenancePlanRepository extends JpaRepository<MaintenancePlan, Long> {
    List<MaintenancePlan> findByStatus(String status);
    List<MaintenancePlan> findByTechnicianId(Long technicianId);
    List<MaintenancePlan> findByTechnicianIdAndStatus(Long technicianId, String status);
    List<MaintenancePlan> findByDispatcherId(Long dispatcherId);
    List<MaintenancePlan> findBySupervisorId(Long supervisorId);
    List<MaintenancePlan> findByElevatorId(Long elevatorId);

    @Query("SELECT p FROM MaintenancePlan p WHERE p.status IN :statuses")
    List<MaintenancePlan> findByStatusIn(@Param("statuses") List<String> statuses);

    @Query("SELECT p FROM MaintenancePlan p WHERE p.technicianId = :technicianId AND p.status IN :statuses")
    List<MaintenancePlan> findByTechnicianIdAndStatusIn(@Param("technicianId") Long technicianId, @Param("statuses") List<String> statuses);
}
