
package com.example.recruitment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewInvitationCreateRequest {

    @NotNull(message = "报名ID不能为空")
    private Long applicationId;

    @NotNull(message = "面试时间不能为空")
    private LocalDateTime interviewTime;

    @NotBlank(message = "面试地点不能为空")
    private String interviewLocation;

    private String interviewerName;

    private String interviewerPhone;

    @NotNull(message = "邀请人ID不能为空")
    private Long invitedBy;

    private String invitedByName;

    private String remark;
}
