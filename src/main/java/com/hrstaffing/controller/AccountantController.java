package com.hrstaffing.controller;

import com.hrstaffing.common.PageResult;
import com.hrstaffing.common.R;
import com.hrstaffing.common.auth.RequireRole;
import com.hrstaffing.common.auth.Role;
import com.hrstaffing.dto.ExceptionQueryDTO;
import com.hrstaffing.dto.ExportRequestDTO;
import com.hrstaffing.dto.ExportTaskQueryDTO;
import com.hrstaffing.dto.ExportTaskVO;
import com.hrstaffing.dto.ScheduleQueryDTO;
import com.hrstaffing.entity.AttendanceException;
import com.hrstaffing.entity.AttendanceSchedule;
import com.hrstaffing.entity.ExportTask;
import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ScheduleStatus;
import com.hrstaffing.service.ExceptionService;
import com.hrstaffing.service.ExportService;
import com.hrstaffing.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/accountant")
@RequiredArgsConstructor
@RequireRole(Role.ACCOUNTANT)
public class AccountantController {

    private final ScheduleService scheduleService;
    private final ExceptionService exceptionService;
    private final ExportService exportService;

    @GetMapping("/dashboard")
    public R<Map<String, Object>> dashboard() {
        Map<String, Object> data = new HashMap<>();

        Map<String, Object> settlementStats = exceptionService.accountantSettlementStats();
        data.put("settlementStats", settlementStats);

        ScheduleQueryDTO sq = new ScheduleQueryDTO();
        sq.setPage(1); sq.setSize(1);
        sq.setStatus(ScheduleStatus.SUBMITTED);
        data.put("schedulesUnconfirmed", scheduleService.accountantPage(sq).getTotal());
        sq.setStatus(ScheduleStatus.EXCEPTION);
        data.put("schedulesInException", scheduleService.accountantPage(sq).getTotal());
        sq.setStatus(ScheduleStatus.CONFIRMED);
        data.put("schedulesReady", scheduleService.accountantPage(sq).getTotal());

        List<Map<String, Object>> actionEntries = new ArrayList<>();
        if ((long) settlementStats.get("confirmedReady") > 0) {
            actionEntries.add(buildEntry("closeException", "异常待归档",
                    "有 " + settlementStats.get("confirmedReady") + " 条已确认异常待归档关闭",
                    "primary", "/accountant/exceptions?status=CONFIRMED", "GET"));
        }
        if ((long) settlementStats.get("pendingConfirm") > 0) {
            actionEntries.add(buildEntry("pendingFlow", "流程中异常",
                    "有 " + settlementStats.get("pendingConfirm") + " 条异常尚在确认流程中",
                    "warning", "/accountant/exceptions", "GET"));
        }
        actionEntries.add(buildEntry("exportSchedule", "导出排班明细",
                        "按日期/状态导出考勤排班Excel用于薪酬核算",
                        "default", "/accountant/exports", "POST"));
        actionEntries.add(buildEntry("exportExceptionSummary", "导出异常汇总",
                        "导出异常确认汇总表用于核对",
                        "default", "/accountant/exports", "POST"));
        actionEntries.add(buildEntry("exportExceptionDetail", "导出异常明细回看",
                        "导出含驳回/补录全流程的异常明细",
                        "default", "/accountant/exports", "POST"));
        data.put("actionEntries", actionEntries);

        List<Map<String, String>> quickFilters = new ArrayList<>();
        quickFilters.add(buildFilter("排班已确认(可核算)", "scheduleStatus=CONFIRMED"));
        quickFilters.add(buildFilter("异常待归档", "exceptionStatus=CONFIRMED"));
        quickFilters.add(buildFilter("异常已归档", "exceptionStatus=CLOSED"));
        quickFilters.add(buildFilter("异常全流程中", "exceptionStatus=PENDING,REJECTED,SUPPLEMENTED"));
        data.put("quickFilters", quickFilters);

        PageResult<ExportTask> recentExports = exportService.myTasks(1, 5);
        data.put("recentExportTasks", recentExports);

        return R.ok(data);
    }

    @GetMapping("/schedules")
    public R<PageResult<AttendanceSchedule>> schedulePage(ScheduleQueryDTO dto) {
        return R.ok(scheduleService.accountantPage(dto));
    }

    @GetMapping("/schedules/{id}")
    public R<AttendanceSchedule> scheduleDetail(@PathVariable Long id) {
        return R.ok(scheduleService.detail(id));
    }

    @GetMapping("/exceptions")
    public R<PageResult<AttendanceException>> exceptionPage(ExceptionQueryDTO dto) {
        return R.ok(exceptionService.accountantPage(dto));
    }

    @GetMapping("/exceptions/{id}")
    public R<Map<String, Object>> exceptionReview(@PathVariable Long id) {
        Map<String, Object> detail = exceptionService.detail(id);
        detail.put("reviewView", true);
        return R.ok("异常确认回看明细", detail);
    }

    @PostMapping("/exceptions/{id}/close")
    public R<AttendanceException> closeException(@PathVariable Long id) {
        return R.ok("异常已归档关闭", exceptionService.closeByAccountant(id));
    }

    @PostMapping("/exports")
    public R<ExportTask> createExport(@Valid @RequestBody ExportRequestDTO dto) {
        return R.ok("导出任务已创建，生成中请稍候", exportService.createTask(dto));
    }

    @GetMapping("/exports/mine")
    public R<PageResult<ExportTaskVO>> myExportTasks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String exportType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String keyword) {
        ExportTaskQueryDTO query = new ExportTaskQueryDTO();
        query.setStatus(status);
        query.setExportType(exportType);
        query.setStartDate(startDate);
        query.setEndDate(endDate);
        query.setKeyword(keyword);
        return R.ok(exportService.myTasks(page, size, query));
    }

    @GetMapping("/exports/all")
    public R<PageResult<ExportTaskVO>> allExportTasks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String exportType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String keyword) {
        ExportTaskQueryDTO query = new ExportTaskQueryDTO();
        query.setStatus(status);
        query.setExportType(exportType);
        query.setStartDate(startDate);
        query.setEndDate(endDate);
        query.setKeyword(keyword);
        return R.ok(exportService.allTasks(page, size, query));
    }

    @GetMapping("/exports/{id}")
    public R<ExportTask> exportDetail(@PathVariable Long id) {
        return R.ok(exportService.detail(id));
    }

    @GetMapping("/exports/{id}/download")
    public ResponseEntity<Resource> downloadExport(@PathVariable Long id) {
        return exportService.download(id);
    }

    private Map<String, Object> buildEntry(String key, String title, String desc,
                                           String level, String path, String method) {
        Map<String, Object> e = new HashMap<>();
        e.put("key", key);
        e.put("title", title);
        e.put("description", desc);
        e.put("level", level);
        e.put("apiPath", path);
        e.put("method", method);
        return e;
    }

    private Map<String, String> buildFilter(String label, String query) {
        Map<String, String> f = new HashMap<>();
        f.put("label", label);
        f.put("query", query);
        return f;
    }
}
