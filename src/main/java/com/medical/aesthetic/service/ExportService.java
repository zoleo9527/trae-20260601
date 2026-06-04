package com.medical.aesthetic.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.aesthetic.dto.ExportRequestDTO;
import com.medical.aesthetic.entity.*;
import com.medical.aesthetic.enums.ExportTaskStatus;
import com.medical.aesthetic.enums.ExportType;
import com.medical.aesthetic.enums.ProjectStatus;
import com.medical.aesthetic.repository.CustomerProjectRepository;
import com.medical.aesthetic.repository.ExportTaskRepository;
import com.medical.aesthetic.repository.MaterialReservationRepository;
import com.medical.aesthetic.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final CustomerProjectRepository customerProjectRepository;
    private final MaterialReservationRepository materialReservationRepository;
    private final OrderRepository orderRepository;
    private final ExportTaskRepository exportTaskRepository;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional(readOnly = true)
    public byte[] exportProjects(ExportRequestDTO dto) throws IOException {
        LocalDateTime start = dto.getStartDate() != null ? dto.getStartDate().atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = dto.getEndDate() != null ? dto.getEndDate().atTime(23, 59, 59) : LocalDateTime.now();

        List<CustomerProject> projects;
        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            projects = customerProjectRepository.findByStatus(ProjectStatus.valueOf(dto.getStatus()));
        } else {
            projects = customerProjectRepository.findScheduledProjects(ProjectStatus.SCHEDULED, start, end);
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("项目排期表");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            String[] headers = {"项目ID", "客户姓名", "客户电话", "项目名称", "咨询师", "医生",
                    "医生助理", "状态", "排期时间", "手术室", "报价", "成交价", "创建时间"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (CustomerProject project : projects) {
                Row row = sheet.createRow(rowNum++);
                createCell(row, 0, project.getId(), dataStyle);
                createCell(row, 1, project.getCustomer().getName(), dataStyle);
                createCell(row, 2, project.getCustomer().getPhone(), dataStyle);
                createCell(row, 3, project.getProject().getName(), dataStyle);
                createCell(row, 4, project.getConsultant().getName(), dataStyle);
                createCell(row, 5, project.getDoctor() != null ? project.getDoctor().getName() : "", dataStyle);
                createCell(row, 6, project.getDoctorAssistant() != null ? project.getDoctorAssistant().getName() : "", dataStyle);
                createCell(row, 7, project.getStatus().getDisplayName(), dataStyle);
                createCell(row, 8, project.getScheduledTime() != null ? project.getScheduledTime().format(DATE_FORMATTER) : "", dataStyle);
                createCell(row, 9, project.getOperatingRoom() != null ? project.getOperatingRoom() : "", dataStyle);
                createCell(row, 10, project.getQuotedPrice() != null ? project.getQuotedPrice().doubleValue() : 0, dataStyle);
                createCell(row, 11, project.getFinalPrice() != null ? project.getFinalPrice().doubleValue() : 0, dataStyle);
                createCell(row, 12, project.getCreatedAt() != null ? project.getCreatedAt().format(DATE_FORMATTER) : "", dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            log.info("项目排期导出成功，共 {} 条记录", projects.size());
            return outputStream.toByteArray();
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportMaterialReservations(ExportRequestDTO dto) throws IOException {
        LocalDateTime start = dto.getStartDate() != null ? dto.getStartDate().atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = dto.getEndDate() != null ? dto.getEndDate().atTime(23, 59, 59) : LocalDateTime.now();

        List<MaterialReservation> reservations = materialReservationRepository.findReservationsByDateRange(start, end);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("耗材预留记录");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            String[] headers = {"预留ID", "项目ID", "客户姓名", "耗材名称", "规格型号", "批号",
                    "数量", "状态", "预留时间", "使用时间", "预留人", "备注"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (MaterialReservation reservation : reservations) {
                Row row = sheet.createRow(rowNum++);
                createCell(row, 0, reservation.getId(), dataStyle);
                createCell(row, 1, reservation.getCustomerProject().getId(), dataStyle);
                createCell(row, 2, reservation.getCustomerProject().getCustomer().getName(), dataStyle);
                createCell(row, 3, reservation.getMaterial().getName(), dataStyle);
                createCell(row, 4, reservation.getMaterial().getSpecification() != null ? reservation.getMaterial().getSpecification() : "", dataStyle);
                createCell(row, 5, reservation.getMaterial().getBatchNumber() != null ? reservation.getMaterial().getBatchNumber() : "", dataStyle);
                createCell(row, 6, reservation.getQuantity(), dataStyle);
                createCell(row, 7, reservation.getStatus().getDisplayName(), dataStyle);
                createCell(row, 8, reservation.getReservedAt() != null ? reservation.getReservedAt().format(DATE_FORMATTER) : "", dataStyle);
                createCell(row, 9, reservation.getUsedAt() != null ? reservation.getUsedAt().format(DATE_FORMATTER) : "", dataStyle);
                createCell(row, 10, reservation.getReservedBy() != null ? reservation.getReservedBy().getName() : "", dataStyle);
                createCell(row, 11, reservation.getRemark() != null ? reservation.getRemark() : "", dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            log.info("耗材预留记录导出成功，共 {} 条记录", reservations.size());
            return outputStream.toByteArray();
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportOrders(ExportRequestDTO dto) throws IOException {
        List<Order> orders = orderRepository.findInstallmentOrders();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("分期款项明细");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            String[] headers = {"订单号", "项目ID", "客户姓名", "总金额", "定金", "已付金额",
                    "剩余金额", "分期期数", "利率", "付款状态", "创建时间", "备注"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Order order : orders) {
                Row row = sheet.createRow(rowNum++);
                createCell(row, 0, order.getOrderNo(), dataStyle);
                createCell(row, 1, order.getCustomerProject().getId(), dataStyle);
                createCell(row, 2, order.getCustomerProject().getCustomer().getName(), dataStyle);
                createCell(row, 3, order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0, dataStyle);
                createCell(row, 4, order.getDepositAmount() != null ? order.getDepositAmount().doubleValue() : 0, dataStyle);
                createCell(row, 5, order.getPaidAmount() != null ? order.getPaidAmount().doubleValue() : 0, dataStyle);
                createCell(row, 6, order.getRemainingAmount() != null ? order.getRemainingAmount().doubleValue() : 0, dataStyle);
                createCell(row, 7, order.getInstallmentMonths() != null ? order.getInstallmentMonths() : 0, dataStyle);
                createCell(row, 8, order.getInstallmentRate() != null ? order.getInstallmentRate().doubleValue() + "%" : "0%", dataStyle);
                createCell(row, 9, order.getPaymentStatus().getDisplayName(), dataStyle);
                createCell(row, 10, order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : "", dataStyle);
                createCell(row, 11, order.getRemark() != null ? order.getRemark() : "", dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            log.info("分期款项明细导出成功，共 {} 条记录", orders.size());
            return outputStream.toByteArray();
        }
    }

    @Async
    @Transactional
    public void asyncExport(ExportRequestDTO dto, String exportType) {
        ExportTask task = createTask(dto, exportType);
        executeTask(task.getId());
    }

    @Transactional
    public ExportTask submitTask(ExportRequestDTO dto, String exportTypeStr) {
        ExportTask task = createTask(dto, exportTypeStr);
        executeTaskAsync(task.getId());
        return task;
    }

    private ExportTask createTask(ExportRequestDTO dto, String exportTypeStr) {
        ExportType exportType = ExportType.valueOf(exportTypeStr.toUpperCase());

        String filterJson = null;
        try {
            filterJson = objectMapper.writeValueAsString(dto);
        } catch (JsonProcessingException e) {
            log.warn("序列化筛选条件失败", e);
        }

        ExportTask task = ExportTask.builder()
                .exportType(exportType)
                .status(ExportTaskStatus.PENDING)
                .filterCriteria(filterJson)
                .fileName(exportType.getDefaultFileName())
                .remark(dto.getIncludeFields())
                .build();

        return exportTaskRepository.save(task);
    }

    @Async
    @Transactional
    public void executeTaskAsync(Long taskId) {
        executeTask(taskId);
    }

    @Transactional
    public void executeTask(Long taskId) {
        ExportTask task = exportTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("导出任务不存在: " + taskId));

        if (task.getStatus() != ExportTaskStatus.PENDING) {
            log.warn("任务状态不是待处理，跳过执行: {}", taskId);
            return;
        }

        task.setStatus(ExportTaskStatus.PROCESSING);
        task.setStartedAt(LocalDateTime.now());
        exportTaskRepository.save(task);

        try {
            ExportRequestDTO dto = parseFilterCriteria(task.getFilterCriteria());
            byte[] content = doExport(task.getExportType(), dto);

            task.setStatus(ExportTaskStatus.COMPLETED);
            task.setFileContent(content);
            task.setFileSize((long) content.length);
            task.setCompletedAt(LocalDateTime.now());
            task.setRecordCount(extractRecordCount(task.getExportType()));

            log.info("导出任务完成 - 任务ID: {}, 类型: {}, 记录数: {}, 文件大小: {} bytes",
                    taskId, task.getExportType(), task.getRecordCount(), task.getFileSize());

        } catch (Exception e) {
            log.error("导出任务失败 - 任务ID: {}", taskId, e);
            task.setStatus(ExportTaskStatus.FAILED);
            task.setCompletedAt(LocalDateTime.now());
            task.setErrorMessage(e.getMessage());
            task.setErrorStackTrace(getStackTrace(e));
        }

        exportTaskRepository.save(task);
    }

    private byte[] doExport(ExportType exportType, ExportRequestDTO dto) throws IOException {
        return switch (exportType) {
            case PROJECTS -> exportProjects(dto);
            case MATERIALS -> exportMaterialReservations(dto);
            case ORDERS -> exportOrders(dto);
        };
    }

    private int extractRecordCount(ExportType exportType) {
        return switch (exportType) {
            case PROJECTS -> customerProjectRepository.findAll().size();
            case MATERIALS -> materialReservationRepository.findAll().size();
            case ORDERS -> orderRepository.findInstallmentOrders().size();
        };
    }

    private ExportRequestDTO parseFilterCriteria(String filterJson) {
        if (filterJson == null || filterJson.isEmpty()) {
            return new ExportRequestDTO();
        }
        try {
            return objectMapper.readValue(filterJson, ExportRequestDTO.class);
        } catch (Exception e) {
            log.warn("反序列化筛选条件失败，使用默认值", e);
            return new ExportRequestDTO();
        }
    }

    private String getStackTrace(Exception e) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }

    @Transactional(readOnly = true)
    public List<ExportTask> getTaskList() {
        return exportTaskRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ExportTask> getRecentTasks() {
        return exportTaskRepository.findTop10ByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ExportTask> getTasksByStatus(ExportTaskStatus status) {
        return exportTaskRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional(readOnly = true)
    public ExportTask getTaskDetail(Long taskId) {
        return exportTaskRepository.findById(taskId).orElse(null);
    }

    @Transactional(readOnly = true)
    public byte[] getTaskFileContent(Long taskId) {
        ExportTask task = exportTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("导出任务不存在: " + taskId));
        if (task.getStatus() != ExportTaskStatus.COMPLETED) {
            throw new IllegalStateException("导出任务尚未完成或已失败，状态: " + task.getStatus().getDisplayName());
        }
        return task.getFileContent();
    }

    @Transactional
    public void retryTask(Long taskId) {
        ExportTask task = exportTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("导出任务不存在: " + taskId));
        if (task.getStatus() != ExportTaskStatus.FAILED) {
            throw new IllegalStateException("只有失败的任务可以重试");
        }
        task.setStatus(ExportTaskStatus.PENDING);
        task.setStartedAt(null);
        task.setCompletedAt(null);
        task.setErrorMessage(null);
        task.setErrorStackTrace(null);
        exportTaskRepository.save(task);
        executeTaskAsync(taskId);
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private void createCell(Row row, int column, Object value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else if (value instanceof LocalDateTime) {
            cell.setCellValue(java.util.Date.from(((LocalDateTime) value).atZone(ZoneId.systemDefault()).toInstant()));
        } else {
            cell.setCellValue(value != null ? value.toString() : "");
        }
        cell.setCellStyle(style);
    }
}
