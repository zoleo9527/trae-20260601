
package com.example.recruitment.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateApplicationQueryRequest {

    private Long positionId;

    private Integer status;

    private String candidateName;

    private String candidatePhone;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer pageNum;

    private Integer pageSize;
}
