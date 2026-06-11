package com.park.decoration.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExceptionNoteDTO {

    private Long id;
    private Long applicationId;
    private String applicationNo;
    private String title;
    private String description;
    private String impact;
    private String responsiblePerson;
    private String resolution;
    private String attachmentUrls;
    private String reportedBy;
    private LocalDateTime reportedAt;
    private String resolvedBy;
    private LocalDateTime resolvedAt;
    private Boolean resolved;
}
