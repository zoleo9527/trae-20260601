
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
@TableName("candidate_application")
public class CandidateApplication {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("position_id")
    private Long positionId;

    @TableField("position_name")
    private String positionName;

    @TableField("candidate_name")
    private String candidateName;

    @TableField("candidate_phone")
    private String candidatePhone;

    @TableField("candidate_id_card")
    private String candidateIdCard;

    @TableField("age")
    private Integer age;

    @TableField("gender")
    private Integer gender;

    @TableField("education")
    private String education;

    @TableField("work_experience")
    private String workExperience;

    @TableField("skills")
    private String skills;

    @TableField("source_channel")
    private String sourceChannel;

    @TableField("judgment_note")
    private String judgmentNote;

    @TableField("status")
    private Integer status;

    @TableField("submitted_by")
    private Long submittedBy;

    @TableField("submitted_by_name")
    private String submittedByName;

    @TableField("submitted_at")
    private LocalDateTime submittedAt;

    @TableField("confirmed_by")
    private Long confirmedBy;

    @TableField("confirmed_at")
    private LocalDateTime confirmedAt;

    @TableField("rejected_reason")
    private String rejectedReason;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
