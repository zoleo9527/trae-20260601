package com.eyeclinic.surgerycenter.repository;

import com.eyeclinic.surgerycenter.entity.Patient;
import com.eyeclinic.surgerycenter.entity.WorkflowInstance;
import com.eyeclinic.surgerycenter.enums.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, Long> {
    Optional<WorkflowInstance> findByWorkflowNo(String workflowNo);

    List<WorkflowInstance> findByStatusIn(List<WorkflowStatus> statuses);

    List<WorkflowInstance> findByPatient(Patient patient);

    @Query("SELECT w FROM WorkflowInstance w WHERE w.status NOT IN (:completedStatuses) " +
           "AND w.currentHandler.id = :handlerId ORDER BY w.createdAt DESC")
    List<WorkflowInstance> findActiveByHandlerId(
            @Param("handlerId") Long handlerId,
            @Param("completedStatuses") List<WorkflowStatus> completedStatuses);

    @Query("SELECT w FROM WorkflowInstance w WHERE w.status NOT IN (:completedStatuses) " +
           "ORDER BY w.createdAt DESC")
    List<WorkflowInstance> findAllActive(
            @Param("completedStatuses") List<WorkflowStatus> completedStatuses);

    boolean existsByPatientAndStatusNotIn(Patient patient, List<WorkflowStatus> completedStatuses);
}
