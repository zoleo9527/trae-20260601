package com.eyeclinic.surgerycenter.repository;

import com.eyeclinic.surgerycenter.entity.PreoperativeCheck;
import com.eyeclinic.surgerycenter.entity.WorkflowInstance;
import com.eyeclinic.surgerycenter.enums.CheckItemStatus;
import com.eyeclinic.surgerycenter.enums.CheckItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreoperativeCheckRepository extends JpaRepository<PreoperativeCheck, Long> {
    List<PreoperativeCheck> findByWorkflowOrderByCreatedAtAsc(WorkflowInstance workflow);

    List<PreoperativeCheck> findByWorkflowAndStatus(WorkflowInstance workflow, CheckItemStatus status);

    Optional<PreoperativeCheck> findByWorkflowAndCheckType(WorkflowInstance workflow, CheckItemType checkType);

    long countByWorkflowAndStatusNot(WorkflowInstance workflow, CheckItemStatus status);
}
