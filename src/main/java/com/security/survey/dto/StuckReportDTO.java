package com.security.survey.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class StuckReportDTO {
    private long totalStuckSurveys;
    private long totalStuckPlans;
    private List<StuckItemDTO> stuckSurveys;
    private List<StuckItemDTO> stuckPlans;
    private long potentialStuckSurveys;
    private long potentialStuckPlans;

    @Data
    public static class StuckItemDTO {
        private Long id;
        private String projectName;
        private String projectCode;
        private String status;
        private String stuckReason;
        private LocalDateTime stuckAt;
        private LocalDateTime updatedAt;
        private String assignedTo;
        private String assignedToName;
        private long stuckHours;
    }
}
