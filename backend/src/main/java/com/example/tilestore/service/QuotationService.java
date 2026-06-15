package com.example.tilestore.service;

import com.example.tilestore.common.BusinessException;
import com.example.tilestore.common.ErrorCode;
import com.example.tilestore.common.UserContext;
import com.example.tilestore.dto.request.QuotationCreateRequest;
import com.example.tilestore.dto.request.QuotationUpdateRequest;
import com.example.tilestore.dto.response.QuotationHistoryResponse;
import com.example.tilestore.dto.response.QuotationResponse;
import com.example.tilestore.entity.*;
import com.example.tilestore.mapper.*;
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
public class QuotationService {

    private final QuotationMapper quotationMapper;
    private final QuotationItemMapper quotationItemMapper;
    private final QuotationHistoryMapper quotationHistoryMapper;
    private final MeasurementRecordMapper measurementRecordMapper;
    private final CustomerMapper customerMapper;
    private final ProductMapper productMapper;
    private final SysUserMapper sysUserMapper;
    private final ObjectMapper objectMapper;

    @Transactional
    public QuotationResponse createQuotation(QuotationCreateRequest request) {
        UserService.checkPermission("DESIGNER", "ADMIN");
        SysUser currentUser = UserContext.getCurrentUser();

        MeasurementRecord measurement = measurementRecordMapper.selectById(request.getMeasurementId());
        if (measurement == null) {
            throw new BusinessException(ErrorCode.MEASUREMENT_NOT_FOUND);
        }

        if (!measurement.getDesignerId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED);
        }

        Customer customer = customerMapper.selectById(measurement.getCustomerId());

        Quotation quotation = new Quotation();
        quotation.setMeasurementId(request.getMeasurementId());
        quotation.setCustomerId(customer.getId());
        quotation.setDesignerId(currentUser.getId());
        quotation.setDiscount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ONE);
        quotation.setValidUntil(request.getValidUntil());
        quotation.setRemark(request.getRemark());
        quotation.setStatus("DRAFT");

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (QuotationCreateRequest.QuotationItemRequest itemRequest : request.getItems()) {
            Product product = productMapper.selectById(itemRequest.getProductId());
            if (product == null) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            BigDecimal itemAmount = product.getPrice().multiply(itemRequest.getQuantity());
            totalAmount = totalAmount.add(itemAmount);
        }

        quotation.setTotalAmount(totalAmount);
        quotation.setFinalAmount(totalAmount.multiply(quotation.getDiscount()));

        quotationMapper.insert(quotation);

        for (QuotationCreateRequest.QuotationItemRequest itemRequest : request.getItems()) {
            Product product = productMapper.selectById(itemRequest.getProductId());
            QuotationItem item = new QuotationItem();
            item.setQuotationId(quotation.getId());
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setSpecification(product.getSpecification());
            item.setColor(product.getColor());
            item.setUnitPrice(product.getPrice());
            item.setQuantity(itemRequest.getQuantity());
            item.setAmount(product.getPrice().multiply(itemRequest.getQuantity()));
            item.setRemark(itemRequest.getRemark());
            quotationItemMapper.insert(item);
        }

        saveHistory(quotation.getId(), null, quotation, "CREATE", "创建报价单");

        return buildResponse(quotation);
    }

    public QuotationResponse getQuotation(Long id) {
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException(ErrorCode.QUOTATION_NOT_FOUND);
        }
        return buildResponse(quotation);
    }

    @Transactional
    public QuotationResponse updateQuotation(Long id, QuotationUpdateRequest request) {
        UserService.checkPermission("DESIGNER", "ADMIN");
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException(ErrorCode.QUOTATION_NOT_FOUND);
        }

        if (!"DRAFT".equals(quotation.getStatus())) {
            throw new BusinessException(ErrorCode.QUOTATION_STATUS_ERROR, "只能修改草稿状态的报价单");
        }

        SysUser currentUser = UserContext.getCurrentUser();
        if (!quotation.getDesignerId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED);
        }

        String beforeData = toJson(quotation);

        if (request.getDiscount() != null) {
            quotation.setDiscount(request.getDiscount());
        }
        if (request.getValidUntil() != null) {
            quotation.setValidUntil(request.getValidUntil());
        }
        if (request.getRemark() != null) {
            quotation.setRemark(request.getRemark());
        }

        if (request.getItems() != null) {
            quotationItemMapper.deleteByQuotationId(id);

            BigDecimal totalAmount = BigDecimal.ZERO;
            for (QuotationCreateRequest.QuotationItemRequest itemRequest : request.getItems()) {
                Product product = productMapper.selectById(itemRequest.getProductId());
                if (product == null) {
                    throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
                }
                BigDecimal itemAmount = product.getPrice().multiply(itemRequest.getQuantity());
                totalAmount = totalAmount.add(itemAmount);

                QuotationItem item = new QuotationItem();
                item.setQuotationId(id);
                item.setProductId(product.getId());
                item.setProductName(product.getName());
                item.setSpecification(product.getSpecification());
                item.setColor(product.getColor());
                item.setUnitPrice(product.getPrice());
                item.setQuantity(itemRequest.getQuantity());
                item.setAmount(itemAmount);
                item.setRemark(itemRequest.getRemark());
                quotationItemMapper.insert(item);
            }

            quotation.setTotalAmount(totalAmount);
            quotation.setFinalAmount(totalAmount.multiply(quotation.getDiscount()));
        }

        quotationMapper.updateById(quotation);

        saveHistory(id, beforeData, quotation, "UPDATE", "更新报价单");

        return buildResponse(quotation);
    }

    @Transactional
    public QuotationResponse submitQuotation(Long id) {
        UserService.checkPermission("DESIGNER", "ADMIN");
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException(ErrorCode.QUOTATION_NOT_FOUND);
        }

        if (!"DRAFT".equals(quotation.getStatus())) {
            throw new BusinessException(ErrorCode.QUOTATION_STATUS_ERROR, "只能提交草稿状态的报价单");
        }

        SysUser currentUser = UserContext.getCurrentUser();
        if (!quotation.getDesignerId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED);
        }

        String beforeData = toJson(quotation);

        quotation.setStatus("SUBMITTED");

        quotationMapper.updateById(quotation);

        saveHistory(id, beforeData, quotation, "SUBMIT", "提交报价单审核");

        return buildResponse(quotation);
    }

    @Transactional
    public QuotationResponse approveQuotation(Long id) {
        UserService.checkPermission("ADMIN");
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException(ErrorCode.QUOTATION_NOT_FOUND);
        }

        if (!"SUBMITTED".equals(quotation.getStatus())) {
            throw new BusinessException(ErrorCode.QUOTATION_STATUS_ERROR, "只能审核已提交的报价单");
        }

        String beforeData = toJson(quotation);

        quotation.setStatus("APPROVED");

        quotationMapper.updateById(quotation);

        saveHistory(id, beforeData, quotation, "APPROVE", "审核通过");

        return buildResponse(quotation);
    }

    @Transactional
    public QuotationResponse rejectQuotation(Long id, String remark) {
        UserService.checkPermission("ADMIN");
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException(ErrorCode.QUOTATION_NOT_FOUND);
        }

        if (!"SUBMITTED".equals(quotation.getStatus())) {
            throw new BusinessException(ErrorCode.QUOTATION_STATUS_ERROR, "只能拒绝已提交的报价单");
        }

        String beforeData = toJson(quotation);

        quotation.setStatus("REJECTED");
        quotation.setRemark(remark);

        quotationMapper.updateById(quotation);

        saveHistory(id, beforeData, quotation, "REJECT", "审核拒绝: " + remark);

        return buildResponse(quotation);
    }

    @Transactional
    public QuotationResponse signQuotation(Long id) {
        UserService.checkPermission("SALESMAN", "ADMIN");
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException(ErrorCode.QUOTATION_NOT_FOUND);
        }

        if (!"APPROVED".equals(quotation.getStatus())) {
            throw new BusinessException(ErrorCode.QUOTATION_STATUS_ERROR, "只能签署已审核通过的报价单");
        }

        String beforeData = toJson(quotation);

        quotation.setStatus("SIGNED");

        quotationMapper.updateById(quotation);

        saveHistory(id, beforeData, quotation, "SIGN", "客户签署报价单");

        return buildResponse(quotation);
    }

    public List<QuotationResponse> listQuotations(String status, Long measurementId, Long customerId, Long designerId) {
        List<Quotation> quotations;

        if (status != null && !status.isEmpty()) {
            quotations = quotationMapper.findByStatus(status);
        } else if (measurementId != null) {
            quotations = quotationMapper.findByMeasurementId(measurementId);
        } else if (customerId != null) {
            quotations = quotationMapper.findByCustomerId(customerId);
        } else if (designerId != null) {
            quotations = quotationMapper.findByDesignerId(designerId);
        } else {
            quotations = quotationMapper.selectList(null);
        }

        return quotations.stream()
                .map(this::buildResponse)
                .collect(Collectors.toList());
    }

    public List<QuotationHistoryResponse> getQuotationHistory(Long id) {
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException(ErrorCode.QUOTATION_NOT_FOUND);
        }

        List<QuotationHistory> histories = quotationHistoryMapper.findByQuotationId(id);

        return histories.stream()
                .map(this::buildHistoryResponse)
                .collect(Collectors.toList());
    }

    private QuotationResponse buildResponse(Quotation quotation) {
        QuotationResponse response = new QuotationResponse();
        response.setId(quotation.getId());
        response.setStatus(quotation.getStatus());
        response.setTotalAmount(quotation.getTotalAmount());
        response.setDiscount(quotation.getDiscount());
        response.setFinalAmount(quotation.getFinalAmount());
        response.setValidUntil(quotation.getValidUntil());
        response.setRemark(quotation.getRemark());
        response.setCreatedAt(quotation.getCreatedAt());
        response.setUpdatedAt(quotation.getUpdatedAt());

        MeasurementRecord measurement = measurementRecordMapper.selectById(quotation.getMeasurementId());
        if (measurement != null) {
            response.setMeasurement(buildMeasurementResponse(measurement));
        }

        Customer customer = customerMapper.selectById(quotation.getCustomerId());
        if (customer != null) {
            QuotationResponse.MeasurementRecordResponse.CustomerResponse customerResponse = new QuotationResponse.MeasurementRecordResponse.CustomerResponse();
            customerResponse.setId(customer.getId());
            customerResponse.setName(customer.getName());
            customerResponse.setPhone(customer.getPhone());
            customerResponse.setAddress(customer.getAddress());
            response.setCustomer(customerResponse);
        }

        SysUser designer = sysUserMapper.selectById(quotation.getDesignerId());
        if (designer != null) {
            QuotationResponse.MeasurementRecordResponse.UserResponse designerResponse = new QuotationResponse.MeasurementRecordResponse.UserResponse();
            designerResponse.setId(designer.getId());
            designerResponse.setUsername(designer.getUsername());
            designerResponse.setRealName(designer.getRealName());
            designerResponse.setPhone(designer.getPhone());
            response.setDesigner(designerResponse);
        }

        List<QuotationItem> items = quotationItemMapper.findByQuotationId(quotation.getId());
        List<QuotationResponse.QuotationItemResponse> itemResponses = items.stream()
                .map(item -> {
                    QuotationResponse.QuotationItemResponse itemResponse = new QuotationResponse.QuotationItemResponse();
                    itemResponse.setId(item.getId());
                    itemResponse.setProductId(item.getProductId());
                    itemResponse.setProductName(item.getProductName());
                    itemResponse.setSpecification(item.getSpecification());
                    itemResponse.setColor(item.getColor());
                    itemResponse.setUnitPrice(item.getUnitPrice());
                    itemResponse.setQuantity(item.getQuantity());
                    itemResponse.setAmount(item.getAmount());
                    itemResponse.setRemark(item.getRemark());
                    return itemResponse;
                })
                .collect(Collectors.toList());
        response.setItems(itemResponses);

        return response;
    }

    private QuotationResponse.MeasurementRecordResponse buildMeasurementResponse(MeasurementRecord measurement) {
        QuotationResponse.MeasurementRecordResponse response = new QuotationResponse.MeasurementRecordResponse();
        response.setId(measurement.getId());
        response.setRoomType(measurement.getRoomType());
        response.setArea(measurement.getArea());
        response.setStatus(measurement.getStatus());
        return response;
    }

    private QuotationHistoryResponse buildHistoryResponse(QuotationHistory history) {
        QuotationHistoryResponse response = new QuotationHistoryResponse();
        response.setId(history.getId());
        response.setAction(history.getAction());
        response.setBeforeData(history.getBeforeData());
        response.setAfterData(history.getAfterData());
        response.setRemark(history.getRemark());
        response.setCreatedAt(history.getCreatedAt());

        SysUser operator = sysUserMapper.selectById(history.getOperatorId());
        if (operator != null) {
            QuotationResponse.MeasurementRecordResponse.UserResponse operatorResponse = new QuotationResponse.MeasurementRecordResponse.UserResponse();
            operatorResponse.setId(operator.getId());
            operatorResponse.setUsername(operator.getUsername());
            operatorResponse.setRealName(operator.getRealName());
            operatorResponse.setPhone(operator.getPhone());
            response.setOperator(operatorResponse);
        }

        return response;
    }

    private void saveHistory(Long quotationId, String beforeData, Quotation quotation, String action, String remark) {
        QuotationHistory history = new QuotationHistory();
        history.setQuotationId(quotationId);
        history.setOperatorId(UserContext.getCurrentUserId());
        history.setOperatorRole(UserContext.getCurrentUserRole());
        history.setAction(action);
        history.setBeforeData(beforeData);
        history.setAfterData(toJson(quotation));
        history.setRemark(remark);
        quotationHistoryMapper.insert(history);
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