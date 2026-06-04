package com.medical.aesthetic.controller;

import com.medical.aesthetic.common.ApiResponse;
import com.medical.aesthetic.entity.HistoryNote;
import com.medical.aesthetic.service.HistoryNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history-notes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HistoryNoteController {

    private final HistoryNoteService historyNoteService;

    @GetMapping("/project/{projectId}")
    public ApiResponse<List<HistoryNote>> getProjectHistory(@PathVariable Long projectId) {
        return ApiResponse.success(historyNoteService.getProjectHistory(projectId));
    }

    @GetMapping("/project/{projectId}/type/{noteType}")
    public ApiResponse<List<HistoryNote>> getProjectHistoryByType(
            @PathVariable Long projectId,
            @PathVariable String noteType) {
        return ApiResponse.success(historyNoteService.getProjectHistoryByType(projectId, noteType));
    }

    @PostMapping("/project/{projectId}")
    public ApiResponse<HistoryNote> addNote(
            @PathVariable Long projectId,
            @RequestParam String noteType,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String fieldChanged,
            @RequestParam(required = false) String oldValue,
            @RequestParam(required = false) String newValue,
            @RequestParam(required = false) String internalRemark) {
        return ApiResponse.success("备注已添加",
                historyNoteService.addNote(projectId, noteType, title, content,
                        fieldChanged, oldValue, newValue, internalRemark));
    }
}
