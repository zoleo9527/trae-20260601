package com.hrstaffing.controller;

import com.hrstaffing.common.PageResult;
import com.hrstaffing.common.R;
import com.hrstaffing.common.auth.RequireRole;
import com.hrstaffing.common.auth.Role;
import com.hrstaffing.dto.*;
import com.hrstaffing.entity.AttendanceException;
import com.hrstaffing.entity.AttendanceSchedule;
import com.hrstaffing.entity.Employee;
import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ScheduleStatus;
import com.hrstaffing.repository.EmployeeRepository;
import com.hrstaffing.service.AttachmentService;
import com.hrstaffing.service.ExceptionService;
import com.hrstaffing.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor")
@RequiredArgsConstructor
@RequireRole(Role.SUPERVISOR)
public class SupervisorController {

    private final ScheduleService scheduleService;
    private final ExceptionService exceptionService;
    private final AttachmentService attachmentService;
    private final EmployeeRepository employeeRepo;

    @GetMapping("/dashboard")
    public R<Map<String, Object>> dashboard() {
        Map<String, Object> data = new HashMap<>();

        Map<String, Object> reviewStats = exceptionService.supervisorReviewStats();
        data.put("reviewStats", reviewStats);

        ScheduleQueryDTO sq = new ScheduleQueryDTO();
        sq.setPage(1); sq.setSize(1);
        sq.setStatus(ScheduleStatus.SUBMITTED);
        data.put("schedulesToConfirm", scheduleService.supervisorPage(sq).getTotal());
        sq.setStatus(ScheduleStatus.EXCEPTION);
        data.put("schedulesInException", scheduleService.supervisorPage(sq).getTotal());
        sq.setStatus(ScheduleStatus.CONFIRMED);
        data.put("schedulesConfirmed", scheduleService.supervisorPage(sq).getTotal());

        List<Map<String, Object>> actionEntries = new ArrayList<>();
        if ((long) reviewStats.get("pendingReview") > 0) {
            actionEntries.add(buildEntry("confirmException", "异常待确认",
                    "有 " + reviewStats.get("pendingReview") + " 条异常待确认",
                    "primary", "/supervisor/exceptions?status=PENDING", "GET"));
        }
        if ((long) reviewStats.get("supplementedReview") > 0) {
            actionEntries.add(buildEntry("reviewSupplement", "补录待复审",
                    "有 " + reviewStats.get("supplementedReview") + " 条补录待复审",
                    "warning", "/supervisor/exceptions?status=SUPPLEMENTED", "GET"));
        }
        if ((long) reviewStats.get("exceededNeedReopen") > 0) {
            actionEntries.add(buildEntry("reopenSupplement", "超期需处理",
                    "有 " + reviewStats.get("exceededNeedReopen") + " 条补录已超期，可重新开启通道",
                    "danger", "/supervisor/exceptions?status=REJECTED", "GET"));
        }
        if ((long) data.get("schedulesToConfirm") > 0) {
            actionEntries.add(buildEntry("confirmSchedule", "排班待确认",
                    "有 " + data.get("schedulesToConfirm") + " 条排班待现场确认",
                    "primary", "/supervisor/schedules?status=SUBMITTED", "GET"));
        }
        if (actionEntries.isEmpty()) {
            actionEntries.add(buildEntry("viewAll", "查看全部",
                    "当前无待办事项，查看全部数据",
                    "default", "/supervisor/schedules", "GET"));
        }
        data.put("actionEntries", actionEntries);

        List<Map<String, String>> quickFilters = new ArrayList<>();
        quickFilters.add(buildFilter("排班待确认", "status=SUBMITTED"));
        quickFilters.add(buildFilter("异常待确认", "exceptionStatus=PENDING"));
        quickFilters.add(buildFilter("补录待复审", "exceptionStatus=SUPPLEMENTED"));
        quickFilters.add(buildFilter("已驳回(含超期)", "exceptionStatus=REJECTED"));
        quickFilters.add(buildFilter("已归档", "exceptionStatus=CLOSED"));
        data.put("quickFilters", quickFilters);

        ExceptionQueryDTO eq = new ExceptionQueryDTO();
        eq.setPage(1); eq.setSize(5);
        eq.setStatus(ExceptionStatus.REJECTED);
        data.put("recentRejectedExceptions", exceptionService.supervisorPage(eq));

        return R.ok(data);
    }

    @GetMapping("/employees")
    public R<List<Employee>> myEmployees(@RequestParam(required = false) String keyword) {
        Long sid = com.hrstaffing.common.auth.UserContext.getCurrent().getUserId();
        return R.ok(employeeRepo.search(keyword, null, sid));
    }

    @GetMapping("/schedules")
    public R<PageResult<AttendanceSchedule>> schedulePage(ScheduleQueryDTO dto) {
        return R.ok(scheduleService.supervisorPage(dto));
    }

    @GetMapping("/schedules/{id}")
    public R<AttendanceSchedule> scheduleDetail(@PathVariable Long id) {
        return R.ok(scheduleService.detail(id));
    }

    @PostMapping("/schedules/{id}/confirm")
    public R<AttendanceSchedule> confirmSchedule(@PathVariable Long id,
                                                  @RequestParam(value = "remark", required = false) String remark) {
        return R.ok("考勤已确认", scheduleService.confirmBySupervisor(id, remark));
    }

    @GetMapping("/exceptions")
    public R<PageResult<AttendanceException>> exceptionPage(ExceptionQueryDTO dto) {
        return R.ok(exceptionService.supervisorPage(dto));
    }

    @GetMapping("/exceptions/{id}")
    public R<Map<String, Object>> exceptionDetail(@PathVariable Long id) {
        return R.ok(exceptionService.detail(id));
    }

    @PostMapping("/exceptions/reject")
    public R<AttendanceException> rejectException(@Valid @RequestBody RejectExceptionDTO dto) {
        return R.ok("已驳回，请招聘专员在规定时间内补录", exceptionService.reject(dto));
    }

    @PostMapping("/exceptions/{id}/reopen")
    public R<AttendanceException> reopenSupplement(@PathVariable Long id,
                                                    @RequestParam int additionalHours,
                                                    @RequestParam(value = "remark", required = false) String remark) {
        return R.ok("已重新开启补录通道", exceptionService.reopenSupplement(id, additionalHours, remark));
    }

    @PostMapping("/exceptions/{id}/confirm")
    public R<AttendanceException> confirmException(@PathVariable Long id,
                                                    @RequestParam(value = "remark", required = false) String remark) {
        return R.ok("异常已确认处理完毕", exceptionService.confirmBySupervisor(id, remark));
    }

    @PostMapping("/attachments")
    public R<com.hrstaffing.entity.Attachment> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("bizType") String bizType,
            @RequestParam("bizId") Long bizId,
            @RequestParam(value = "remark", required = false) String remark) {
        return R.ok("上传成功", attachmentService.upload(file, bizType, bizId, remark));
    }

    @GetMapping("/attachments")
    public R<List<com.hrstaffing.entity.Attachment>> listAttachments(
            @RequestParam("bizType") String bizType,
            @RequestParam("bizId") Long bizId) {
        return R.ok(attachmentService.listByBiz(bizType, bizId));
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
