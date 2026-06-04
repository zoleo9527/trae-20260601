package com.eyeclinic.surgerycenter.dto;

import com.eyeclinic.surgerycenter.enums.CheckItemStatus;
import com.eyeclinic.surgerycenter.enums.CheckItemType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

public class PreoperativeCheckDTO {

    @Data
    public static class UpdateRequest {
        @NotNull(message = "检查项ID不能为空")
        private Long checkId;

        @NotNull(message = "检查状态不能为空")
        private CheckItemStatus status;

        @NotNull(message = "检查人ID不能为空")
        private Long operatorId;

        private String checkResult;

        private String measurementValue;

        private String referenceRange;

        private String remarks;

        private String attachmentUrl;
    }

    @Data
    public static class BatchUpdateRequest {
        @NotNull(message = "工作流ID不能为空")
        private Long workflowId;

        @NotNull(message = "检查类型不能为空")
        private CheckItemType checkType;

        @NotNull(message = "检查状态不能为空")
        private CheckItemStatus status;

        @NotNull(message = "检查人ID不能为空")
        private Long operatorId;

        private String checkResult;

        private String measurementValue;
    }

    @Data
    public static class DetailVO {
        private Long id;
        private CheckItemType checkType;
        private String checkTypeName;
        private CheckItemStatus status;
        private String statusName;
        private String checkResult;
        private String measurementValue;
        private String referenceRange;
        private String checkedByName;
        private String checkedAt;
        private String remarks;
        private String attachmentUrl;
    }
}
