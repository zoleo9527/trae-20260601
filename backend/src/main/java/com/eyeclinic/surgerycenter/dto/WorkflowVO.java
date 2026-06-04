package com.eyeclinic.surgerycenter.dto;

import com.eyeclinic.surgerycenter.enums.SurgeryType;
import com.eyeclinic.surgerycenter.enums.WorkflowStatus;
import lombok.Data;

import java.util.List;

@Data
public class WorkflowVO {
    private Long id;
    private String workflowNo;
    private Long patientId;
    private String patientName;
    private String patientNo;
    private SurgeryType surgeryType;
    private String surgeryTypeName;
    private WorkflowStatus status;
    private String statusName;
    private String statusDescription;
    private String currentHandler;
    private String currentHandlerRole;
    private String blockReason;
    private String remarks;
    private String createdAt;
    private String updatedAt;
    private String statusUpdatedAt;

    private List<PreoperativeCheckDTO.DetailVO> checkItems;
    private ScheduleInfoVO scheduleInfo;
    private List<OperationLogVO> operationLogs;

    @Data
    public static class ScheduleInfoVO {
        private Long id;
        private String surgeryDate;
        private String startTime;
        private String endTime;
        private String operatingRoom;
        private String surgeonName;
        private String anesthesiologistName;
        private String materialList;
        private String remarks;
        private Boolean confirmed;
    }

    @Data
    public static class OperationLogVO {
        private Long id;
        private String operationType;
        private String operationDesc;
        private String previousStatus;
        private String newStatus;
        private String operatorName;
        private String remarks;
        private String createdAt;
    }

    @Data
    public static class SimpleVO {
        private Long id;
        private String workflowNo;
        private String patientName;
        private SurgeryType surgeryType;
        private String surgeryTypeName;
        private WorkflowStatus status;
        private String statusName;
        private String currentHandler;
        private String currentHandlerRole;
        private String blockReason;
        private String createdAt;
    }
}
