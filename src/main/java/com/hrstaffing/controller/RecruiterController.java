package com.hrstaffing.controller;

import com.hrstaffing.common.PageResult;
import com.hrstaffing.common.R;
import com.hrstaffing.common.auth.RequireRole;
import com.hrstaffing.common.auth.Role;
import com.hrstaffing.dto.*;
import com.hrstaffing.entity.AttendanceException;
import com.hrstaffing.entity.AttendanceSchedule;
import com.hrstaffing.entity.Employee;
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
@RequestMapping("/recruiter")
@RequiredArgsConstructor
@RequireRole(Role.RECRUITER)
public class RecruiterController {

    private final ScheduleService scheduleService;
    private final ExceptionService exceptionService;
    private final AttachmentService attachmentService;
    private final EmployeeRepository employeeRepo;

    @GetMapping("/dashboard")
    public R<Map<String, Object>> dashboard() {
        Map<String, Object> data = new HashMap<>();

        Map<String, Object> deadlineStats = exceptionService.recruiterDeadlineStats();
        data.put("deadlineStats", deadlineStats);

        ScheduleQueryDTO sq = new ScheduleQueryDTO();
        sq.setPage(1); sq.setSize(1);
        sq.setStatus(ScheduleStatus.DRAFT);
        data.put("draftSchedules", scheduleService.recruiterPage(sq).getTotal());
        sq.setStatus(ScheduleStatus.SUBMITTED);
        data.put("submittedSchedules", scheduleService.recruiterPage(sq).getTotal());
        sq.setStatus(ScheduleStatus.EXCEPTION);
        data.put("exceptionSchedules", scheduleService.recruiterPage(sq).getTotal());
        sq.setStatus(ScheduleStatus.CONFIRMED);
        data.put("confirmedSchedules", scheduleService.recruiterPage(sq).getTotal());

        List<Map<String, Object>> actionEntries = new ArrayList<>();
        actionEntries.add(buildEntry("createSchedule", "新建排班", "录入员工当日考勤排班",
                "primary", "/recruiter/schedules", "POST"));
        if ((long) deadlineStats.get("deadlineApproaching") > 0 || (long) deadlineStats.get("deadlineExceeded") > 0) {
            actionEntries.add(buildEntry("handleSupplement", "补录待处理",
                    "有 " + deadlineStats.get("deadlineApproaching") + " 条即将超期、"
                            + deadlineStats.get("deadlineExceeded") + " 条已超期需补录",
                    "danger", "/recruiter/exceptions?status=REJECTED", "GET"));
        }
        if ((long) deadlineStats.get("supplementedAwaitingReview") > 0) {
            actionEntries.add(buildEntry("awaitingReview", "补录待复审",
                    "已提交 " + deadlineStats.get("supplementedAwaitingReview") + " 条补录等待主管复审",
                    "warning", "/recruiter/exceptions?status=SUPPLEMENTED", "GET"));
        }
        actionEntries.add(buildEntry("submitException", "上报考勤异常",
                "对已提交排班提交异常申诉",
                "default", "/recruiter/exceptions", "POST"));
        data.put("actionEntries", actionEntries);

        List<Map<String, String>> quickFilters = new ArrayList<>();
        quickFilters.add(buildFilter("我的草稿", "status=DRAFT"));
        quickFilters.add(buildFilter("待主管确认", "status=SUBMITTED"));
        quickFilters.add(buildFilter("需补录(急)", "status=REJECTED"));
        quickFilters.add(buildFilter("异常处理中", "status=EXCEPTION"));
        data.put("quickFilters", quickFilters);

        return R.ok(data);
    }

    @GetMapping("/employees")
    public R<List<Employee>> myEmployees(@RequestParam(required = false) String keyword) {
        Long rid = com.hrstaffing.common.auth.UserContext.getCurrent().getUserId();
        return R.ok(employeeRepo.search(keyword, rid, null));
    }

    @PostMapping("/schedules")
    public R<AttendanceSchedule> createSchedule(@Valid @RequestBody ScheduleCreateDTO dto) {
        return R.ok("创建排班成功", scheduleService.create(dto));
    }

    @PutMapping("/schedules/{id}")
    public R<AttendanceSchedule> updateSchedule(@PathVariable Long id,
                                                 @RequestBody ScheduleUpdateDTO dto) {
        return R.ok("更新排班成功", scheduleService.update(id, dto));
    }

    @DeleteMapping("/schedules/{id}")
    public R<Void> deleteSchedule(@PathVariable Long id) {
        scheduleService.delete(id);
        return R.ok("删除成功", null);
    }

    @PostMapping("/schedules/{id}/submit")
    public R<AttendanceSchedule> submitSchedule(@PathVariable Long id) {
        return R.ok("已提交驻场主管确认", scheduleService.submit(id));
    }

    @GetMapping("/schedules")
    public R<PageResult<AttendanceSchedule>> schedulePage(ScheduleQueryDTO dto) {
        return R.ok(scheduleService.recruiterPage(dto));
    }

    @GetMapping("/schedules/{id}")
    public R<AttendanceSchedule> scheduleDetail(@PathVariable Long id) {
        return R.ok(scheduleService.detail(id));
    }

    @PostMapping("/exceptions")
    public R<AttendanceException> createException(@Valid @RequestBody ExceptionCreateDTO dto) {
        return R.ok("异常已提交，等待驻场主管确认", exceptionService.createException(dto));
    }

    @GetMapping("/exceptions")
    public R<PageResult<AttendanceException>> exceptionPage(ExceptionQueryDTO dto) {
        return R.ok(exceptionService.recruiterPage(dto));
    }

    @GetMapping("/exceptions/{id}")
    public R<Map<String, Object>> exceptionDetail(@PathVariable Long id) {
        return R.ok(exceptionService.detail(id));
    }

    @PostMapping("/exceptions/supplement")
    public R<AttendanceException> submitSupplement(@Valid @RequestBody SupplementSubmitDTO dto) {
        return R.ok("补录已提交，等待主管复审", exceptionService.submitSupplement(dto));
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

    @DeleteMapping("/attachments/{id}")
    public R<Void> deleteAttachment(@PathVariable Long id) {
        attachmentService.delete(id);
        return R.ok("删除成功", null);
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
