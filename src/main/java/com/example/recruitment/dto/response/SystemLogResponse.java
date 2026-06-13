
package com.example.recruitment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogResponse {

    private Long id;

    private String module;

    private String moduleDesc;

    private String operationType;

    private String operationTypeDesc;

    private String targetType;

    private Long targetId;

    private Long operatorId;

    private String operatorName;

    private String content;

    private LocalDateTime createdAt;
}
