package com.park.decoration.dto;

import com.park.decoration.enums.ApplicationStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ApplicationDetailDTO {

    private DecorationApplicationDTO application;
    private List<EntryPermitDTO> permits;
    private List<ExceptionNoteDTO> exceptions;
    private List<OperationLogDTO> operationLogs;
}
