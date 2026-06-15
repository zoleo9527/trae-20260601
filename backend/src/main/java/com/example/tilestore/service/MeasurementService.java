package com.example.tilestore.service;

import com.example.tilestore.common.BusinessException;
import com.example.tilestore.common.ErrorCode;
import com.example.tilestore.common.UserContext;
import com.example.tilestore.dto.request.MeasurementCreateRequest;
import com.example.tilestore.dto.request.MeasurementUpdateRequest;
import com.example.tilestore.dto.response.MeasurementHistoryResponse;
import com.example.tilestore.dto.response.MeasurementRecordResponse;
import com.example.tilestore.entity.*;
import com.example.tilestore.mapper.CustomerMapper;
import com.example.tilestore.mapper.MeasurementHistoryMapper;
import com.example.tilestore.mapper.MeasurementRecordMapper;
import com.example.tilestore.mapper.SysUserMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeasurementService {

    private final MeasurementRecordMapper measurementRecordMapper;
    private final MeasurementHistoryMapper measurementHistoryMapper;
    private final CustomerMapper customerMapper;
    private final SysUserMapper sysUserMapper;
    private final ObjectMapper objectMapper;

    @Transactional
    public MeasurementRecordResponse createMeasurement(MeasurementCreateRequest request) {
        UserService.checkPermission("SALESMAN", "ADMIN");
        SysUser currentUser = UserContext.getCurrentUser();

        Customer customer = customerMapper.findByPhone(request.getCustomerPhone());
        if (customer == null) {
            customer = new Customer();
            customer.setName(request.getCustomerName());
            customer.setPhone(request.getCustomerPhone());
            customer.setAddress(request.getCustomerAddress());
            customer.setRemark(request.getCustomerRemark());
            customerMapper.insert(customer);
        }

        MeasurementRecord record = new MeasurementRecord();
        record.setCustomerId(customer.getId());
        record.setSalesmanId(currentUser.getId());
        record.setRoomType(request.getRoomType());
        record.setLength(request.getLength());
        record.setWidth(request.getWidth());
        record.setHeight(request.getHeight());
        record.setArea(request.getLength().multiply(request.getWidth()));
        record.setWindowsInfo(request.getWindowsInfo());
        record.setDoorsInfo(request.getDoorsInfo());
        record.setWallInfo(request.getWallInfo());
        record.setFloorInfo(request.getFloorInfo());
        record.setPhotos(request.getPhotos());
        record.setRemark(request.getRemark());
        record.setStatus("PENDING");

        measurementRecordMapper.insert(record);

        saveHistory(record.getId(), null, record, "CREATE", "创建量房记录");

        return buildResponse(record);
    }

    public MeasurementRecordResponse getMeasurement(Long id) {
        MeasurementRecord record = measurementRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ErrorCode.MEASUREMENT_NOT_FOUND);
        }
        return buildResponse(record);
    }

    @Transactional
    public MeasurementRecordResponse updateMeasurement(Long id, MeasurementUpdateRequest request) {
        UserService.checkPermission("SALESMAN", "DESIGNER", "ADMIN");
        MeasurementRecord record = measurementRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ErrorCode.MEASUREMENT_NOT_FOUND);
        }

        SysUser currentUser = UserContext.getCurrentUser();
        if (!record.getSalesmanId().equals(currentUser.getId()) 
            && !"ADMIN".equals(currentUser.getRole())
            && !record.getDesignerId().equals(currentUser.getId())) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED);
        }

        String beforeData = toJson(record);

        record.setLength(request.getLength());
        record.setWidth(request.getWidth());
        record.setHeight(request.getHeight());
        record.setArea(request.getLength().multiply(request.getWidth()));
        record.setWindowsInfo(request.getWindowsInfo());
        record.setDoorsInfo(request.getDoorsInfo());
        record.setWallInfo(request.getWallInfo());
        record.setFloorInfo(request.getFloorInfo());
        record.setPhotos(request.getPhotos());
        record.setRemark(request.getRemark());

        measurementRecordMapper.updateById(record);

        saveHistory(id, beforeData, record, "UPDATE", "更新量房记录");

        return buildResponse(record);
    }

    @Transactional
    public MeasurementRecordResponse assignDesigner(Long id, Long designerId) {
        UserService.checkPermission("SALESMAN", "ADMIN");
        MeasurementRecord record = measurementRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ErrorCode.MEASUREMENT_NOT_FOUND);
        }

        SysUser designer = sysUserMapper.selectById(designerId);
        if (designer == null || !"DESIGNER".equals(designer.getRole())) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        String beforeData = toJson(record);

        record.setDesignerId(designerId);
        record.setStatus("IN_DESIGN");

        measurementRecordMapper.updateById(record);

        saveHistory(id, beforeData, record, "ASSIGN", "分配设计师: " + designer.getRealName());

        return buildResponse(record);
    }

    @Transactional
    public MeasurementRecordResponse completeMeasurement(Long id) {
        UserService.checkPermission("DESIGNER", "ADMIN");
        MeasurementRecord record = measurementRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ErrorCode.MEASUREMENT_NOT_FOUND);
        }

        SysUser currentUser = UserContext.getCurrentUser();
        if (!record.getDesignerId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED);
        }

        String beforeData = toJson(record);

        record.setStatus("COMPLETED");

        measurementRecordMapper.updateById(record);

        saveHistory(id, beforeData, record, "COMPLETE", "完成量房");

        return buildResponse(record);
    }

    public List<MeasurementRecordResponse> listMeasurements(String status, Long customerId, Long salesmanId, Long designerId) {
        List<MeasurementRecord> records;

        if (status != null && !status.isEmpty()) {
            records = measurementRecordMapper.findByStatus(status);
        } else if (salesmanId != null) {
            records = measurementRecordMapper.findBySalesmanId(salesmanId);
        } else if (designerId != null) {
            records = measurementRecordMapper.findByDesignerId(designerId);
        } else {
            records = measurementRecordMapper.selectList(null);
        }

        return records.stream()
                .map(this::buildResponse)
                .collect(Collectors.toList());
    }

    public List<MeasurementHistoryResponse> getMeasurementHistory(Long id) {
        MeasurementRecord record = measurementRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(ErrorCode.MEASUREMENT_NOT_FOUND);
        }

        List<MeasurementHistory> histories = measurementHistoryMapper.findByMeasurementId(id);

        return histories.stream()
                .map(this::buildHistoryResponse)
                .collect(Collectors.toList());
    }

    private MeasurementRecordResponse buildResponse(MeasurementRecord record) {
        MeasurementRecordResponse response = new MeasurementRecordResponse();
        response.setId(record.getId());
        response.setRoomType(record.getRoomType());
        response.setLength(record.getLength());
        response.setWidth(record.getWidth());
        response.setHeight(record.getHeight());
        response.setArea(record.getArea());
        response.setWindowsInfo(record.getWindowsInfo());
        response.setDoorsInfo(record.getDoorsInfo());
        response.setWallInfo(record.getWallInfo());
        response.setFloorInfo(record.getFloorInfo());
        response.setPhotos(record.getPhotos());
        response.setRemark(record.getRemark());
        response.setStatus(record.getStatus());
        response.setCreatedAt(record.getCreatedAt());
        response.setUpdatedAt(record.getUpdatedAt());

        Customer customer = customerMapper.selectById(record.getCustomerId());
        if (customer != null) {
            MeasurementRecordResponse.CustomerResponse customerResponse = new MeasurementRecordResponse.CustomerResponse();
            customerResponse.setId(customer.getId());
            customerResponse.setName(customer.getName());
            customerResponse.setPhone(customer.getPhone());
            customerResponse.setAddress(customer.getAddress());
            response.setCustomer(customerResponse);
        }

        SysUser salesman = sysUserMapper.selectById(record.getSalesmanId());
        if (salesman != null) {
            MeasurementRecordResponse.UserResponse salesmanResponse = new MeasurementRecordResponse.UserResponse();
            salesmanResponse.setId(salesman.getId());
            salesmanResponse.setUsername(salesman.getUsername());
            salesmanResponse.setRealName(salesman.getRealName());
            salesmanResponse.setPhone(salesman.getPhone());
            response.setSalesman(salesmanResponse);
        }

        if (record.getDesignerId() != null) {
            SysUser designer = sysUserMapper.selectById(record.getDesignerId());
            if (designer != null) {
                MeasurementRecordResponse.UserResponse designerResponse = new MeasurementRecordResponse.UserResponse();
                designerResponse.setId(designer.getId());
                designerResponse.setUsername(designer.getUsername());
                designerResponse.setRealName(designer.getRealName());
                designerResponse.setPhone(designer.getPhone());
                response.setDesigner(designerResponse);
            }
        }

        return response;
    }

    private MeasurementHistoryResponse buildHistoryResponse(MeasurementHistory history) {
        MeasurementHistoryResponse response = new MeasurementHistoryResponse();
        response.setId(history.getId());
        response.setAction(history.getAction());
        response.setBeforeData(history.getBeforeData());
        response.setAfterData(history.getAfterData());
        response.setRemark(history.getRemark());
        response.setCreatedAt(history.getCreatedAt());

        SysUser operator = sysUserMapper.selectById(history.getOperatorId());
        if (operator != null) {
            MeasurementRecordResponse.UserResponse operatorResponse = new MeasurementRecordResponse.UserResponse();
            operatorResponse.setId(operator.getId());
            operatorResponse.setUsername(operator.getUsername());
            operatorResponse.setRealName(operator.getRealName());
            operatorResponse.setPhone(operator.getPhone());
            response.setOperator(operatorResponse);
        }

        return response;
    }

    private void saveHistory(Long measurementId, String beforeData, MeasurementRecord record, String action, String remark) {
        MeasurementHistory history = new MeasurementHistory();
        history.setMeasurementId(measurementId);
        history.setOperatorId(UserContext.getCurrentUserId());
        history.setOperatorRole(UserContext.getCurrentUserRole());
        history.setAction(action);
        history.setBeforeData(beforeData);
        history.setAfterData(toJson(record));
        history.setRemark(remark);
        measurementHistoryMapper.insert(history);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("JSON序列化失败", e);
            return null;
        }
    }
}