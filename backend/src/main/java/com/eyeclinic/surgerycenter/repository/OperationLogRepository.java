package com.eyeclinic.surgerycenter.repository;

import com.eyeclinic.surgerycenter.entity.OperationLog;
import com.eyeclinic.surgerycenter.entity.WorkflowInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {
    List<OperationLog> findByWorkflowOrderByCreatedAtDesc(WorkflowInstance workflow);
    List<OperationLog> findByWorkflowNoOrderByCreatedAtDesc(String workflowNo);
}
