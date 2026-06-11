package com.park.decoration.service;

import com.park.decoration.dto.ExceptionNoteDTO;
import com.park.decoration.dto.ExceptionReportRequest;
import com.park.decoration.dto.ExceptionResolveRequest;

import java.util.List;

public interface ExceptionNoteService {

    ExceptionNoteDTO reportException(ExceptionReportRequest request);

    ExceptionNoteDTO resolveException(Long id, ExceptionResolveRequest request);

    ExceptionNoteDTO getExceptionById(Long id);

    List<ExceptionNoteDTO> getExceptionsByApplicationId(Long applicationId);

    List<ExceptionNoteDTO> getUnresolvedExceptions();

    List<ExceptionNoteDTO> listExceptions(Boolean resolved, String responsiblePerson, String applicationNo);
}
