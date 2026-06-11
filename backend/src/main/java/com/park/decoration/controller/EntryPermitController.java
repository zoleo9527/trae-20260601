package com.park.decoration.controller;

import com.park.decoration.dto.ApiResponse;
import com.park.decoration.dto.EntryPermitDTO;
import com.park.decoration.dto.EntryPermitRequest;
import com.park.decoration.service.EntryPermitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/permits")
@RequiredArgsConstructor
public class EntryPermitController {

    private final EntryPermitService permitService;

    @PostMapping
    public ApiResponse<EntryPermitDTO> issuePermit(@Valid @RequestBody EntryPermitRequest request) {
        return ApiResponse.success(permitService.issuePermit(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<EntryPermitDTO> getById(@PathVariable Long id) {
        return ApiResponse.success(permitService.getPermitById(id));
    }

    @GetMapping("/no/{permitNo}")
    public ApiResponse<EntryPermitDTO> getByNo(@PathVariable String permitNo) {
        return ApiResponse.success(permitService.getPermitByNo(permitNo));
    }

    @GetMapping("/application/{applicationId}")
    public ApiResponse<List<EntryPermitDTO>> getByApplicationId(@PathVariable Long applicationId) {
        return ApiResponse.success(permitService.getPermitsByApplicationId(applicationId));
    }

    @GetMapping("/application/{applicationId}/latest")
    public ApiResponse<EntryPermitDTO> getLatest(@PathVariable Long applicationId) {
        return ApiResponse.success(permitService.getLatestPermit(applicationId));
    }

    @PostMapping("/{id}/revoke")
    public ApiResponse<EntryPermitDTO> revokePermit(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "未说明原因");
        String operator = body.getOrDefault("operator", "system");
        return ApiResponse.success(permitService.revokePermit(id, reason, operator));
    }
}
