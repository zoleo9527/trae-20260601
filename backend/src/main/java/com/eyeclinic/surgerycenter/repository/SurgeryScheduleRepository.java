package com.eyeclinic.surgerycenter.repository;

import com.eyeclinic.surgerycenter.entity.SurgerySchedule;
import com.eyeclinic.surgerycenter.entity.WorkflowInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SurgeryScheduleRepository extends JpaRepository<SurgerySchedule, Long> {
    Optional<SurgerySchedule> findByWorkflow(WorkflowInstance workflow);

    List<SurgerySchedule> findBySurgeryDateOrderByStartTimeAsc(LocalDate surgeryDate);

    @Query("SELECT s FROM SurgerySchedule s WHERE s.surgeryDate = :date " +
           "AND s.operatingRoom = :room " +
           "AND s.confirmed = true " +
           "AND ((s.startTime <= :startTime AND s.endTime > :startTime) " +
           "OR (s.startTime < :endTime AND s.endTime >= :endTime) " +
           "OR (s.startTime >= :startTime AND s.endTime <= :endTime))")
    List<SurgerySchedule> findConflictingSchedules(
            @Param("date") LocalDate date,
            @Param("room") String room,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    List<SurgerySchedule> findByConfirmedTrueAndSurgeryDateBetweenOrderBySurgeryDateAscStartTimeAsc(
            LocalDate startDate, LocalDate endDate);
}
