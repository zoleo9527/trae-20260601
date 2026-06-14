package com.example.bank.service.impl;

import com.example.bank.dto.response.ExportTaskResponse;
import com.example.bank.entity.Appointment;
import com.example.bank.entity.ExportTask;
import com.example.bank.repository.AppointmentRepository;
import com.example.bank.repository.ExportTaskRepository;
import com.example.bank.service.ExportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements ExportService {

    private final ExportTaskRepository exportTaskRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public ExportTaskResponse createExportTask(String exportType, Long appointmentId) {
        ExportTask task = ExportTask.builder()
                .taskNo(generateTaskNo())
                .exportType(exportType)
                .appointmentId(appointmentId)
                .status("PENDING")
                .build();

        task = exportTaskRepository.save(task);
        return convertToResponse(task);
    }

    @Override
    public ExportTaskResponse getExportTaskById(Long id) {
        ExportTask task = exportTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("导出任务不存在"));
        return convertToResponse(task);
    }

    @Override
    public ExportTaskResponse getExportTaskByNo(String taskNo) {
        ExportTask task = exportTaskRepository.findByTaskNo(taskNo);
        if (task == null) {
            throw new RuntimeException("导出任务不存在");
        }
        return convertToResponse(task);
    }

    @Override
    public List<ExportTaskResponse> getAllExportTasks() {
        return exportTaskRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ExportTaskResponse> getExportTasksByStatus(String status) {
        return exportTaskRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExportTaskResponse executeExport(Long taskId) {
        ExportTask task = exportTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("导出任务不存在"));

        task.setStatus("PROCESSING");
        task = exportTaskRepository.save(task);

        try {
            List<Appointment> appointments;
            if ("SINGLE".equals(task.getExportType()) && task.getAppointmentId() != null) {
                Appointment appointment = appointmentRepository.findById(task.getAppointmentId())
                        .orElseThrow(() -> new RuntimeException("预约不存在"));
                appointments = List.of(appointment);
            } else {
                appointments = appointmentRepository.findAll();
            }
            
            String filePath = generateExportFile(appointments, task.getExportType());

            task.setStatus("COMPLETED");
            task.setFilePath(filePath);
            task.setRecordCount(appointments.size());
            task.setCompletedAt(LocalDateTime.now());
        } catch (Exception e) {
            task.setStatus("FAILED");
            throw new RuntimeException("导出失败: " + e.getMessage());
        }

        task = exportTaskRepository.save(task);
        return convertToResponse(task);
    }

    private String generateTaskNo() {
        return "EXPORT" + System.currentTimeMillis() % 100000000;
    }

    private String generateExportFile(List<Appointment> appointments, String exportType) throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "appointments_" + exportType.toLowerCase() + "_" + timestamp + ".json";
        String filePath = System.getProperty("java.io.tmpdir") + File.separator + fileName;

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.enable(SerializationFeature.INDENT_OUTPUT);

        mapper.writeValue(new File(filePath), appointments);

        return filePath;
    }

    private ExportTaskResponse convertToResponse(ExportTask task) {
        return ExportTaskResponse.builder()
                .id(task.getId())
                .taskNo(task.getTaskNo())
                .exportType(task.getExportType())
                .appointmentId(task.getAppointmentId())
                .status(task.getStatus())
                .filePath(task.getFilePath())
                .recordCount(task.getRecordCount())
                .createdAt(task.getCreatedAt())
                .completedAt(task.getCompletedAt())
                .build();
    }
}