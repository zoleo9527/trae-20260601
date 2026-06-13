
package com.example.recruitment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("interview_invitation")
public class InterviewInvitation {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("application_id")
    private Long applicationId;

    @TableField("position_id")
    private Long positionId;

    @TableField("position_name")
    private String positionName;

    @TableField("candidate_name")
    private String candidateName;

    @TableField("candidate_phone")
    private String candidatePhone;

    @TableField("interview_time")
    private LocalDateTime interviewTime;

    @TableField("interview_location")
    private String interviewLocation;

    @TableField("interviewer_name")
    private String interviewerName;

    @TableField("interviewer_phone")
    private String interviewerPhone;

    @TableField("status")
    private Integer status;

    @TableField("invited_by")
    private Long invitedBy;

    @TableField("invited_by_name")
    private String invitedByName;

    @TableField("invited_at")
    private LocalDateTime invitedAt;

    @TableField("confirmed_at")
    private LocalDateTime confirmedAt;

    @TableField("candidate_confirmed")
    private Integer candidateConfirmed;

    @TableField("no_show_reason")
    private String noShowReason;

    @TableField("remark")
    private String remark;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
