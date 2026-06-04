package com.medical.aesthetic.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.aesthetic.dto.ExportRequestDTO;
import com.medical.aesthetic.dto.ExportTaskVO;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final CustomerProjectRepository customerProjectRepository;
    private final MaterialReservationRepository materialReservationRepository;
    private final OrderRepository orderRepository;
    private final ExportTaskRepository exportTaskRepository;
    private final AsyncExportService asyncExportService;
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

    @Transactional
    public ExportTaskVO submitTask(ExportRequestDTO dto, String exportTypeStr) {
        ExportTask task = createTask(dto, exportTypeStr);
        Long taskId = task.getId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                log.info("事务已提交，启动异步导出任务: {}", taskId);
                asyncExportService.executeTaskAsync(taskId);
            }
        });
        return ExportTaskVO.fromEntity(task);
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

    @Transactional(readOnly = true)
    public List<ExportTaskVO> getTaskList() {
        return exportTaskRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ExportTaskVO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExportTaskVO> getRecentTasks() {
        return exportTaskRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(ExportTaskVO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExportTaskVO> getTasksByStatus(ExportTaskStatus status) {
        return exportTaskRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(ExportTaskVO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExportTaskVO getTaskDetail(Long taskId) {
        return exportTaskRepository.findById(taskId)
                .map(ExportTaskVO::fromEntity)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public byte[] getTaskFileContent(Long taskId) {
        ExportTask task = exportTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("导出任务不存在: " + taskId));
        if (task.getStatus() != ExportTaskStatus.COMPLETED) {
            throw new IllegalStateException("导出任务尚未完成或已失败，状态: " + task.getStatus().getDisplayName());
        }
        if (task.getFileContent() == null || task.getFileContent().length == 0) {
            throw new IllegalStateException("导出文件内容为空，任务ID: " + taskId + "，可能文件生成异常，请重试");
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
        task.setFileContent(null);
        task.setFileSize(null);
        task.setRecordCount(null);
        exportTaskRepository.save(task);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                log.info("事务已提交，启动重试导出任务: {}", taskId);
                asyncExportService.executeTaskAsync(taskId);
            }
        });
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
