package com.park.decoration.controller;

import com.park.decoration.dto.ApiResponse;
import com.park.decoration.dto.ExceptionNoteDTO;
import com.park.decoration.dto.ExceptionReportRequest;
import com.park.decoration.dto.ExceptionResolveRequest;
import com.park.decoration.service.ExceptionNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exceptions")
@RequiredArgsConstructor
public class ExceptionNoteController {

    private final ExceptionNoteService exceptionService;

    @PostMapping
    public ApiResponse<ExceptionNoteDTO> reportException(
            @Valid @RequestBody ExceptionReportRequest request) {
        return ApiResponse.success(exceptionService.reportException(request));
    }

    @PostMapping("/{id}/resolve")
    public ApiResponse<ExceptionNoteDTO> resolveException(
            @PathVariable Long id,
            @Valid @RequestBody ExceptionResolveRequest request) {
        return ApiResponse.success(exceptionService.resolveException(id, request));
    }

    @GetMapping("/{id}")
    public ApiResponse<ExceptionNoteDTO> getById(@PathVariable Long id) {
        return ApiResponse.success(exceptionService.getExceptionById(id));
    }

    @GetMapping("/application/{applicationId}")
    public ApiResponse<List<ExceptionNoteDTO>> getByApplicationId(
            @PathVariable Long applicationId) {
        return ApiResponse.success(exceptionService.getExceptionsByApplicationId(applicationId));
    }

    @GetMapping("/unresolved")
    public ApiResponse<List<ExceptionNoteDTO>> getUnresolved() {
        return ApiResponse.success(exceptionService.getUnresolvedExceptions());
    }
}
