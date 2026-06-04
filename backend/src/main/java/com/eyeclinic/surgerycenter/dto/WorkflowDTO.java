package com.eyeclinic.surgerycenter.dto;

import com.eyeclinic.surgerycenter.enums.SurgeryType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

public class WorkflowDTO {

    @Data
    public static class CreateRequest {
        @NotNull(message = "患者ID不能为空")
        private Long patientId;

        @NotNull(message = "手术类型不能为空")
        private SurgeryType surgeryType;

        private String remarks;
    }

    @Data
    public static class StartCheckRequest {
        @NotNull(message = "处理人ID不能为空")
        private Long handlerId;

        @NotNull(message = "检查负责人ID不能为空")
        private Long checkerId;
    }

    @Data
    public static class StartSchedulingRequest {
        @NotNull(message = "处理人ID不能为空")
        private Long handlerId;
    }

    @Data
    public static class SubmitForReviewRequest {
        @NotNull(message = "提交人ID不能为空")
        private Long operatorId;

        private String remarks;
    }

    @Data
    public static class ReviewRequest {
        @NotNull(message = "审核人ID不能为空")
        private Long reviewerId;

        private Boolean approved;

        private String rejectionReason;
    }

    @Data
    public static class ScheduleRequest {
        @NotNull(message = "处理人ID不能为空")
        private Long handlerId;

        @NotNull(message = "手术日期不能为空")
        private String surgeryDate;

        @NotNull(message = "开始时间不能为空")
        private String startTime;

        @NotNull(message = "手术室不能为空")
        private String operatingRoom;

        private Long surgeonId;

        private Long anesthesiologistId;

        private String materialList;

        private String remarks;
    }
}
