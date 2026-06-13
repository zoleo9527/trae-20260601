package com.hrstaffing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrstaffing.common.PageResult;
import com.hrstaffing.common.auth.UserContext;
import com.hrstaffing.common.exception.BizException;
import com.hrstaffing.dto.ExportRequestDTO;
import com.hrstaffing.entity.AttendanceException;
import com.hrstaffing.entity.AttendanceSchedule;
import com.hrstaffing.entity.ExportTask;
import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ExportStatus;
import com.hrstaffing.enums.ScheduleStatus;
import com.hrstaffing.repository.AttendanceExceptionRepository;
import com.hrstaffing.repository.AttendanceScheduleRepository;
import com.hrstaffing.repository.ExportTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final ExportTaskRepository taskRepo;
    private final AttendanceScheduleRepository scheduleRepo;
    private final AttendanceExceptionRepository excRepo;
    private final ObjectMapper objectMapper;

    @Value("${export.base-dir:/tmp/hrstaffing-exports}")
    private String exportBaseDir;

    public static final String TYPE_SCHEDULE = "SCHEDULE";
    public static final String TYPE_EXCEPTION = "EXCEPTION";
    public static final String TYPE_EXCEPTION_DETAIL = "EXCEPTION_DETAIL";

    @Transactional
    public ExportTask createTask(ExportRequestDTO dto) {
        ensureDir();
        UserContext.CurrentUser user = UserContext.getCurrent();
        ExportTask task = new ExportTask();
        String type = dto.getExportType() != null ? dto.getExportType() : TYPE_SCHEDULE;
        String name = dto.getTaskName() != null ? dto.getTaskName() :
                (typeLabel(type) + "_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")));
        task.setTaskName(name);
        task.setExportType(type);
        try {
            task.setQueryParamsJson(objectMapper.writeValueAsString(dto));
        } catch (JsonProcessingException ignored) {
            task.setQueryParamsJson("{}");
        }
        task.setStatus(ExportStatus.PENDING);
        task.setCreatedBy(user.getUserId());
        task.setCreatedByName(user.getUserName());
        ExportTask saved = taskRepo.save(task);
        doExportAsync(saved.getId());
        return saved;
    }

    @Async
    @Transactional
    public void doExportAsync(Long taskId) {
        ExportTask task = taskRepo.findById(taskId).orElse(null);
        if (task == null) return;
        try {
            task.setStatus(ExportStatus.PROCESSING);
            task.setStartedAt(LocalDateTime.now());
            taskRepo.save(task);

            ExportRequestDTO params;
            try {
                params = objectMapper.readValue(task.getQueryParamsJson(), ExportRequestDTO.class);
            } catch (Exception e) {
                params = new ExportRequestDTO();
            }

            Path out = buildOutputPath(task);
            Files.createDirectories(out.getParent());

            switch (task.getExportType()) {
                case TYPE_EXCEPTION -> exportExceptionExcel(params, out);
                case TYPE_EXCEPTION_DETAIL -> exportExceptionDetailExcel(params, out);
                default -> exportScheduleExcel(params, out);
            }

            File f = out.toFile();
            task.setFilePath(f.getAbsolutePath());
            task.setFileName(f.getName());
            task.setFileSize(f.length());
            task.setStatus(ExportStatus.SUCCESS);
            task.setFinishedAt(LocalDateTime.now());
            log.info("Export task {} success: {}", task.getId(), f.getAbsolutePath());
        } catch (Exception e) {
            log.error("Export task {} failed", task.getId(), e);
            task.setStatus(ExportStatus.FAILED);
            task.setFailReason(e.getMessage() != null ? e.getMessage() : "未知错误");
            task.setFinishedAt(LocalDateTime.now());
        }
        taskRepo.save(task);
    }

    public PageResult<ExportTask> myTasks(int page, int size) {
        Long uid = UserContext.getCurrent().getUserId();
        Pageable p = PageRequest.of(Math.max(page - 1, 0), size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ExportTask> pg = taskRepo.findByCreatedByOrderByCreatedAtDesc(uid, p);
        return PageResult.of(pg.getTotalElements(), page, size, pg.getContent());
    }

    public PageResult<ExportTask> allTasks(int page, int size) {
        Pageable p = PageRequest.of(Math.max(page - 1, 0), size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ExportTask> pg = taskRepo.findByOrderByCreatedAtDesc(p);
        return PageResult.of(pg.getTotalElements(), page, size, pg.getContent());
    }

    public ExportTask detail(Long id) {
        return taskRepo.findById(id)
                .orElseThrow(() -> new BizException("导出任务不存在"));
    }

    public ResponseEntity<Resource> download(Long id) {
        ExportTask t = taskRepo.findById(id)
                .orElseThrow(() -> new BizException("导出任务不存在"));
        if (t.getStatus() != ExportStatus.SUCCESS) {
            throw new BizException("任务未完成或失败，当前状态: " + t.getStatus().getLabel());
        }
        File f = new File(t.getFilePath());
        if (!f.exists()) {
            throw new BizException("文件已丢失");
        }
        Resource r = new FileSystemResource(f);
        String encoded;
        try {
            encoded = URLEncoder.encode(t.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");
        } catch (Exception e) {
            encoded = "export.xlsx";
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encoded + "\"; filename*=UTF-8''" + encoded)
                .body(r);
    }

    private void exportScheduleExcel(ExportRequestDTO p, Path out) throws IOException {
        try (SXSSFWorkbook wb = new SXSSFWorkbook(1000)) {
            Sheet sh = wb.createSheet("考勤排班");
            createHeader(wb, sh, new String[]{
                    "员工编号", "员工姓名", "排班日期", "上班时间", "下班时间",
                    "计划工时", "实际打卡入", "实际打卡出", "实际工时",
                    "加班工时", "请假工时", "状态", "招聘专员", "驻场主管", "备注"
            });
            ScheduleStatus status = parseScheduleStatus(p.getStatus());
            int pageNo = 0, pageSize = 500, row = 1;
            while (true) {
                Pageable pg = PageRequest.of(pageNo, pageSize, Sort.by("scheduleDate", "id"));
                Page<AttendanceSchedule> slice = scheduleRepo.searchPage(
                        null, null, p.getEmployeeId(), status,
                        p.getStartDate(), p.getEndDate(), p.getKeyword(), pg);
                for (AttendanceSchedule s : slice.getContent()) {
                    Row r = sh.createRow(row++);
                    writeCell(r, 0, s.getEmployeeNo());
                    writeCell(r, 1, s.getEmployeeName());
                    writeCell(r, 2, fmt(s.getScheduleDate()));
                    writeCell(r, 3, fmt(s.getShiftStart()));
                    writeCell(r, 4, fmt(s.getShiftEnd()));
                    writeCell(r, 5, s.getScheduledHours());
                    writeCell(r, 6, fmt(s.getActualPunchIn()));
                    writeCell(r, 7, fmt(s.getActualPunchOut()));
                    writeCell(r, 8, s.getActualWorkHours());
                    writeCell(r, 9, s.getOvertimeHours());
                    writeCell(r, 10, s.getLeaveHours());
                    writeCell(r, 11, s.getStatus() != null ? s.getStatus().getLabel() : "");
                    writeCell(r, 12, s.getRecruiterName());
                    writeCell(r, 13, s.getSupervisorName());
                    writeCell(r, 14, s.getScheduleRemark());
                }
                if (!slice.hasNext()) break;
                pageNo++;
            }
            autoSize(sh, 15);
            try (FileOutputStream fos = new FileOutputStream(out.toFile())) {
                wb.write(fos);
            }
            wb.dispose();
        }
    }

    private void exportExceptionExcel(ExportRequestDTO p, Path out) throws IOException {
        try (SXSSFWorkbook wb = new SXSSFWorkbook(1000)) {
            Sheet sh = wb.createSheet("异常确认汇总");
            createHeader(wb, sh, new String[]{
                    "异常ID", "员工编号", "员工姓名", "异常日期", "异常类型",
                    "异常描述", "影响工时", "状态", "驳回次数",
                    "是否超期", "招聘专员", "驻场主管", "最新驳回原因",
                    "补录说明", "创建时间"
            });
            ExceptionStatus status = parseExceptionStatus(p.getStatus());
            com.hrstaffing.enums.ExceptionType type = null;
            if (p.getKeyword() != null && !p.getKeyword().isEmpty()) {
                try {
                    type = com.hrstaffing.enums.ExceptionType.valueOf(p.getKeyword().toUpperCase());
                } catch (Exception ignored) {
                }
            }
            int pageNo = 0, pageSize = 500, row = 1;
            while (true) {
                Pageable pg = PageRequest.of(pageNo, pageSize, Sort.by("exceptionDate", "id"));
                Page<AttendanceException> slice = excRepo.searchPage(
                        null, null, p.getEmployeeId(), status, type,
                        p.getStartDate(), p.getEndDate(), p.getKeyword(), pg);
                for (AttendanceException e : slice.getContent()) {
                    Row r = sh.createRow(row++);
                    writeCell(r, 0, e.getId());
                    writeCell(r, 1, e.getEmployeeNo());
                    writeCell(r, 2, e.getEmployeeName());
                    writeCell(r, 3, fmt(e.getExceptionDate()));
                    writeCell(r, 4, e.getExceptionType().getLabel());
                    writeCell(r, 5, e.getDescription());
                    writeCell(r, 6, e.getAffectedHours());
                    writeCell(r, 7, e.getStatus().getLabel());
                    writeCell(r, 8, e.getRejectCount());
                    writeCell(r, 9, e.isDeadlineExceeded() ? "是" : "否");
                    writeCell(r, 10, e.getRecruiterName());
                    writeCell(r, 11, e.getSupervisorName());
                    writeCell(r, 12, e.getLatestRejectReason());
                    writeCell(r, 13, e.getSupplementRemark());
                    writeCell(r, 14, fmt(e.getCreatedAt()));
                }
                if (!slice.hasNext()) break;
                pageNo++;
            }
            autoSize(sh, 15);
            try (FileOutputStream fos = new FileOutputStream(out.toFile())) {
                wb.write(fos);
            }
            wb.dispose();
        }
    }

    private void exportExceptionDetailExcel(ExportRequestDTO p, Path out) throws IOException {
        try (SXSSFWorkbook wb = new SXSSFWorkbook(1000)) {
            Sheet sh = wb.createSheet("异常确认明细-回看");
            createHeader(wb, sh, new String[]{
                    "异常ID", "员工", "异常日期", "异常类型", "初始描述",
                    "驳回记录(时间/原因/截止)", "补录记录(时间/内容/凭证说明)",
                    "最终状态", "确认人/备注", "关闭人", "全流程时效(小时)"
            });
            ExceptionStatus status = parseExceptionStatus(p.getStatus());
            int pageNo = 0, pageSize = 200, row = 1;
            while (true) {
                Pageable pg = PageRequest.of(pageNo, pageSize, Sort.by("exceptionDate", "id"));
                Page<AttendanceException> slice = excRepo.searchPage(
                        null, null, p.getEmployeeId(), status, null,
                        p.getStartDate(), p.getEndDate(), p.getKeyword(), pg);
                for (AttendanceException e : slice.getContent()) {
                    Row r = sh.createRow(row++);
                    writeCell(r, 0, e.getId());
                    writeCell(r, 1, e.getEmployeeName() + "(" + e.getEmployeeNo() + ")");
                    writeCell(r, 2, fmt(e.getExceptionDate()));
                    writeCell(r, 3, e.getExceptionType().getLabel());
                    writeCell(r, 4, e.getDescription());
                    String rejects = buildRejectText(e);
                    String supplements = buildSupplementText(e);
                    writeCell(r, 5, rejects);
                    writeCell(r, 6, supplements);
                    writeCell(r, 7, e.getStatus().getLabel());
                    writeCell(r, 8, (e.getConfirmedAt() != null ? fmt(e.getConfirmedAt()) + " / " : "")
                            + nullToEmpty(e.getConfirmRemark()));
                    writeCell(r, 9, e.getClosedBy() != null ? String.valueOf(e.getClosedBy()) : "");
                    double hours = 0;
                    if (e.getCreatedAt() != null) {
                        LocalDateTime end = e.getClosedAt() != null ? e.getClosedAt()
                                : (e.getConfirmedAt() != null ? e.getConfirmedAt() : LocalDateTime.now());
                        hours = java.time.Duration.between(e.getCreatedAt(), end).toMinutes() / 60.0;
                    }
                    writeCell(r, 10, String.format("%.1f", hours));
                }
                if (!slice.hasNext()) break;
                pageNo++;
            }
            autoSize(sh, 11);
            try (FileOutputStream fos = new FileOutputStream(out.toFile())) {
                wb.write(fos);
            }
            wb.dispose();
        }
    }

    private String buildRejectText(AttendanceException e) {
        if (e.getLastRejectedAt() == null) return "无";
        StringBuilder sb = new StringBuilder();
        sb.append("第").append(e.getRejectCount()).append("次驳回 ");
        sb.append(fmt(e.getLastRejectedAt())).append(" / ");
        sb.append(nullToEmpty(e.getLatestRejectReason())).append(" / ");
        sb.append("截止").append(fmt(e.getRejectDeadline()));
        return sb.toString();
    }

    private String buildSupplementText(AttendanceException e) {
        if (e.getSupplementedAt() == null) return "无";
        return fmt(e.getSupplementedAt()) + " / " + nullToEmpty(e.getSupplementRemark());
    }

    private Path buildOutputPath(ExportTask t) throws IOException {
        String dateDir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Path dir = Paths.get(exportBaseDir, dateDir);
        Files.createDirectories(dir);
        String safeName = t.getTaskName().replaceAll("[^\\w\\u4e00-\\u9fa5-]", "_");
        String fileName = safeName + "_" + t.getId() + ".xlsx";
        return dir.resolve(fileName);
    }

    private void ensureDir() {
        try {
            Files.createDirectories(Paths.get(exportBaseDir));
        } catch (IOException e) {
            throw new BizException("初始化导出目录失败");
        }
    }

    private void createHeader(Workbook wb, Sheet sh, String[] headers) {
        CellStyle style = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        style.setFont(f);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Row r = sh.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell c = r.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(style);
        }
    }

    private void writeCell(Row r, int idx, Object v) {
        Cell c = r.createCell(idx);
        if (v == null) c.setCellValue("");
        else if (v instanceof Number n) c.setCellValue(n.doubleValue());
        else c.setCellValue(v.toString());
    }

    private void autoSize(Sheet sh, int cols) {
        for (int i = 0; i < cols; i++) {
            sh.setColumnWidth(i, 20 * 256);
        }
    }

    private String fmt(LocalDate d) { return d == null ? "" : d.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")); }
    private String fmt(LocalDateTime d) { return d == null ? "" : d.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")); }
    private String fmt(java.time.LocalTime t) { return t == null ? "" : t.format(DateTimeFormatter.ofPattern("HH:mm")); }
    private String nullToEmpty(String s) { return s == null ? "" : s; }
    private ScheduleStatus parseScheduleStatus(String s) {
        if (s == null || s.isEmpty()) return null;
        try { return ScheduleStatus.valueOf(s); } catch (Exception e) { return null; }
    }
    private ExceptionStatus parseExceptionStatus(String s) {
        if (s == null || s.isEmpty()) return null;
        try { return ExceptionStatus.valueOf(s); } catch (Exception e) { return null; }
    }

    private String typeLabel(String type) {
        return switch (type) {
            case TYPE_EXCEPTION -> "异常确认汇总";
            case TYPE_EXCEPTION_DETAIL -> "异常确认明细回看";
            default -> "考勤排班明细";
        };
    }

    public List<AttendanceSchedule> listSchedulesForExport(LocalDate start, LocalDate end) {
        Pageable p = PageRequest.of(0, 10000, Sort.by("scheduleDate"));
        return scheduleRepo.searchPage(null, null, null, null, start, end, null, p).getContent();
    }

    public List<AttendanceException> listExceptionsForExport(LocalDate start, LocalDate end) {
        Pageable p = PageRequest.of(0, 10000, Sort.by("exceptionDate"));
        return excRepo.searchPage(null, null, null, null, null, start, end, null, p).getContent();
    }
}
