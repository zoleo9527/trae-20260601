
package com.example.recruitment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewInvitationStatusRequest {

    @NotNull(message = "状态不能为空")
    private Integer status;

    private Long operatorId;

    private String operatorName;

    private String noShowReason;

    private String remark;
}
