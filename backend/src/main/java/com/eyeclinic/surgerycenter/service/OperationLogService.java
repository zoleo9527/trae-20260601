package com.eyeclinic.surgerycenter.service;

import com.eyeclinic.surgerycenter.entity.OperationLog;
import com.eyeclinic.surgerycenter.entity.User;
import com.eyeclinic.surgerycenter.entity.WorkflowInstance;
import com.eyeclinic.surgerycenter.enums.WorkflowStatus;
import com.eyeclinic.surgerycenter.repository.OperationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogRepository operationLogRepository;

    @Transactional
    public OperationLog createLog(WorkflowInstance workflow,
                                  WorkflowStatus previousStatus,
                                  WorkflowStatus newStatus,
                                  String operationType,
                                  String operationDesc,
                                  User operator,
                                  String remarks) {
        OperationLog log = new OperationLog();
        log.setWorkflow(workflow);
        log.setWorkflowNo(workflow.getWorkflowNo());
        log.setPreviousStatus(previousStatus);
        log.setNewStatus(newStatus);
        log.setOperationType(operationType);
        log.setOperationDesc(operationDesc);
        log.setOperator(operator);
        log.setOperatorName(operator != null ? operator.getRealName() : "系统");
        log.setRemarks(remarks);
        return operationLogRepository.save(log);
    }

    @Transactional
    public OperationLog createStatusTransitionLog(WorkflowInstance workflow,
                                                  WorkflowStatus previousStatus,
                                                  WorkflowStatus newStatus,
                                                  User operator,
                                                  String remarks) {
        String operationDesc = String.format("状态从[%s]变更为[%s]",
                previousStatus.getDescription(), newStatus.getDescription());
        return createLog(workflow, previousStatus, newStatus, "状态变更", operationDesc, operator, remarks);
    }

    public List<OperationLog> getLogsByWorkflow(WorkflowInstance workflow) {
        return operationLogRepository.findByWorkflowOrderByCreatedAtDesc(workflow);
    }

    public List<OperationLog> getLogsByWorkflowNo(String workflowNo) {
        return operationLogRepository.findByWorkflowNoOrderByCreatedAtDesc(workflowNo);
    }
}
