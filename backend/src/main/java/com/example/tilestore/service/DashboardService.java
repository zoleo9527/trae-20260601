package com.example.tilestore.service;

import com.example.tilestore.common.UserContext;
import com.example.tilestore.dto.response.MeasurementRecordResponse;
import com.example.tilestore.dto.response.QuotationResponse;
import com.example.tilestore.dto.response.TodoStatsResponse;
import com.example.tilestore.entity.MeasurementRecord;
import com.example.tilestore.entity.Quotation;
import com.example.tilestore.entity.SysUser;
import com.example.tilestore.mapper.MeasurementRecordMapper;
import com.example.tilestore.mapper.QuotationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MeasurementRecordMapper measurementRecordMapper;
    private final QuotationMapper quotationMapper;
    private final MeasurementService measurementService;
    private final QuotationService quotationService;

    public TodoStatsResponse getTodoStats() {
        SysUser currentUser = UserContext.getCurrentUser();
        if (currentUser == null) {
            return new TodoStatsResponse();
        }

        String role = currentUser.getRole();
        TodoStatsResponse stats = new TodoStatsResponse();

        if ("SALESMAN".equals(role)) {
            List<MeasurementRecord> records = measurementRecordMapper.findBySalesmanId(currentUser.getId());
            long pendingAssign = records.stream()
                    .filter(r -> r.getDesignerId() == null)
                    .count();
            stats.setPendingAssignCount(pendingAssign);
        } else if ("DESIGNER".equals(role)) {
            List<MeasurementRecord> measurements = measurementRecordMapper.findByDesignerId(currentUser.getId());
            long pendingComplete = measurements.stream()
                    .filter(r -> !"COMPLETED".equals(r.getStatus()))
                    .count();
            stats.setPendingCompleteCount(pendingComplete);

            List<Quotation> quotations = quotationMapper.findByDesignerId(currentUser.getId());
            long pendingSubmit = quotations.stream()
                    .filter(q -> "DRAFT".equals(q.getStatus()))
                    .count();
            stats.setPendingSubmitCount(pendingSubmit);
        } else if ("ADMIN".equals(role)) {
            List<Quotation> quotations = quotationMapper.selectList(null);
            long pendingApprove = quotations.stream()
                    .filter(q -> "SUBMITTED".equals(q.getStatus()))
                    .count();
            stats.setPendingApproveCount(pendingApprove);

            List<MeasurementRecord> records = measurementRecordMapper.selectList(null);
            long pendingAssign = records.stream()
                    .filter(r -> r.getDesignerId() == null)
                    .count();
            stats.setPendingAssignCount(pendingAssign);
        }

        return stats;
    }

    public List<MeasurementRecordResponse> getPendingAssignMeasurements() {
        SysUser currentUser = UserContext.getCurrentUser();
        if (currentUser == null || !"SALESMAN".equals(currentUser.getRole())) {
            return List.of();
        }

        List<MeasurementRecord> records = measurementRecordMapper.findBySalesmanId(currentUser.getId());
        return records.stream()
                .filter(r -> r.getDesignerId() == null)
                .map(measurementService::buildResponse)
                .collect(Collectors.toList());
    }

    public List<MeasurementRecordResponse> getPendingCompleteMeasurements() {
        SysUser currentUser = UserContext.getCurrentUser();
        if (currentUser == null || !"DESIGNER".equals(currentUser.getRole())) {
            return List.of();
        }

        List<MeasurementRecord> records = measurementRecordMapper.findByDesignerId(currentUser.getId());
        return records.stream()
                .filter(r -> !"COMPLETED".equals(r.getStatus()))
                .map(measurementService::buildResponse)
                .collect(Collectors.toList());
    }

    public List<QuotationResponse> getPendingSubmitQuotations() {
        SysUser currentUser = UserContext.getCurrentUser();
        if (currentUser == null || !"DESIGNER".equals(currentUser.getRole())) {
            return List.of();
        }

        List<Quotation> quotations = quotationMapper.findByDesignerId(currentUser.getId());
        return quotations.stream()
                .filter(q -> "DRAFT".equals(q.getStatus()))
                .map(quotationService::buildResponse)
                .collect(Collectors.toList());
    }

    public List<QuotationResponse> getPendingApproveQuotations() {
        SysUser currentUser = UserContext.getCurrentUser();
        if (currentUser == null || !"ADMIN".equals(currentUser.getRole())) {
            return List.of();
        }

        List<Quotation> quotations = quotationMapper.selectList(null);
        return quotations.stream()
                .filter(q -> "SUBMITTED".equals(q.getStatus()))
                .map(quotationService::buildResponse)
                .collect(Collectors.toList());
    }
}