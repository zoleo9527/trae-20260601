package com.example.tailor.service;

import com.example.tailor.dto.request.CreateFeedbackRequest;
import com.example.tailor.dto.request.FeedbackQueryRequest;
import com.example.tailor.dto.request.ProcessFeedbackRequest;
import com.example.tailor.dto.response.*;
import com.example.tailor.entity.FabricCard;
import com.example.tailor.entity.FittingFeedback;
import com.example.tailor.entity.Measurement;
import com.example.tailor.entity.Order;
import com.example.tailor.enums.FeedbackStatus;
import com.example.tailor.exception.BusinessException;
import com.example.tailor.repository.FabricCardRepository;
import com.example.tailor.repository.FittingFeedbackRepository;
import com.example.tailor.repository.MeasurementRepository;
import com.example.tailor.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FittingFeedbackService {

    private final FittingFeedbackRepository feedbackRepository;
    private final OrderRepository orderRepository;
    private final MeasurementRepository measurementRepository;
    private final FabricCardRepository fabricCardRepository;
    private final ModificationRecordService modificationRecordService;
    private final NotificationService notificationService;

    public FittingFeedbackService(FittingFeedbackRepository feedbackRepository, OrderRepository orderRepository,
                                  MeasurementRepository measurementRepository, FabricCardRepository fabricCardRepository,
                                  ModificationRecordService modificationRecordService, NotificationService notificationService) {
        this.feedbackRepository = feedbackRepository;
        this.orderRepository = orderRepository;
        this.measurementRepository = measurementRepository;
        this.fabricCardRepository = fabricCardRepository;
        this.modificationRecordService = modificationRecordService;
        this.notificationService = notificationService;
    }

    @Transactional
    public FittingFeedbackDTO createFeedback(CreateFeedbackRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new BusinessException("订单不存在：" + request.getOrderId()));

        String feedbackNo = generateFeedbackNo();

        FittingFeedback feedback = new FittingFeedback();
        feedback.setOrder(order);
        feedback.setFeedbackNo(feedbackNo);
        feedback.setCustomerId(request.getCustomerId());
        feedback.setCustomerName(request.getCustomerName());
        feedback.setFittingDate(request.getFittingDate() != null ? request.getFittingDate() : LocalDateTime.now());
        feedback.setFittingType(request.getFittingType());
        feedback.setOverallFeedback(request.getOverallFeedback());
        feedback.setDetails(request.getDetails());
        feedback.setStatus(FeedbackStatus.PENDING);

        FittingFeedback saved = feedbackRepository.save(feedback);

        notificationService.triggerFeedbackCreated(saved.getId(), feedbackNo, order.getId(), order.getOrderNo(), request.getCustomerName());

        return convertToDTO(saved);
    }

    public FittingFeedbackDTO getFeedbackById(Long id) {
        FittingFeedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new BusinessException("试衣反馈不存在：" + id));
        return convertToDTO(feedback);
    }

    public FittingFeedbackDTO getFeedbackByNo(String feedbackNo) {
        FittingFeedback feedback = feedbackRepository.findByFeedbackNo(feedbackNo)
                .orElseThrow(() -> new BusinessException("试衣反馈不存在：" + feedbackNo));
        return convertToDTO(feedback);
    }

    @Transactional
    public FittingFeedbackDTO processFeedback(Long id, ProcessFeedbackRequest request) {
        FittingFeedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new BusinessException("试衣反馈不存在：" + id));

        feedback.setStatus(FeedbackStatus.PROCESSING);
        feedback.setProcessorId(request.getProcessorId());
        feedback.setProcessorName(request.getProcessorName());
        feedback.setProcessTime(LocalDateTime.now());
        feedback.setProcessNote(request.getProcessNote());

        FittingFeedback saved = feedbackRepository.save(feedback);

        notificationService.triggerFeedbackProcessed(saved.getId(), saved.getFeedbackNo(),
                saved.getOrder().getId(), saved.getOrder().getOrderNo(), request.getProcessorName());

        return convertToDTO(saved);
    }

    @Transactional
    public FittingFeedbackDTO resolveFeedback(Long id) {
        FittingFeedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new BusinessException("试衣反馈不存在：" + id));

        feedback.setStatus(FeedbackStatus.RESOLVED);

        FittingFeedback saved = feedbackRepository.save(feedback);
        return convertToDTO(saved);
    }

    public PageResponse<FittingFeedbackDTO> queryFeedbacks(FeedbackQueryRequest request) {
        Pageable pageable = PageRequest.of(
                request.getPage() != null ? request.getPage() : 0,
                request.getSize() != null ? request.getSize() : 10,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<FittingFeedback> page;

        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                FeedbackStatus status = FeedbackStatus.valueOf(request.getStatus().toUpperCase());
                page = feedbackRepository.findByStatus(status, pageable);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("无效的状态值：" + request.getStatus());
            }
        } else if (request.getOrderId() != null) {
            page = feedbackRepository.findByOrderId(request.getOrderId(), pageable);
        } else if (request.getCustomerId() != null) {
            page = feedbackRepository.findByCustomerId(request.getCustomerId(), pageable);
        } else if (request.getOrderNo() != null && !request.getOrderNo().isEmpty()) {
            page = feedbackRepository.findByOrderOrderNoContaining(request.getOrderNo(), pageable);
        } else if (request.getStartDate() != null && request.getEndDate() != null) {
            page = feedbackRepository.findByFittingDateBetween(request.getStartDate(), request.getEndDate(), pageable);
        } else {
            page = feedbackRepository.findAll(pageable);
        }

        List<FittingFeedbackDTO> content = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResponse<FittingFeedbackDTO> response = new PageResponse<>();
        response.setContent(content);
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());

        return response;
    }

    private String generateFeedbackNo() {
        return "FB" + System.currentTimeMillis();
    }

    private FittingFeedbackDTO convertToDTO(FittingFeedback feedback) {
        Order order = feedback.getOrder();

        Measurement measurement = measurementRepository.findByOrderId(order.getId()).orElse(null);
        FabricCard fabricCard = order.getFabricCard();

        List<ModificationRecordDTO> modifications = modificationRecordService.getByFeedbackId(feedback.getId());

        FittingFeedbackDTO dto = new FittingFeedbackDTO();
        dto.setId(feedback.getId());
        dto.setOrderId(order.getId());
        dto.setOrderNo(order.getOrderNo());
        dto.setProductName(order.getProductName());
        dto.setProductType(order.getProductType());
        dto.setFeedbackNo(feedback.getFeedbackNo());
        dto.setCustomerId(feedback.getCustomerId());
        dto.setCustomerName(feedback.getCustomerName());
        dto.setFittingDate(feedback.getFittingDate());
        dto.setFittingType(feedback.getFittingType());
        dto.setOverallFeedback(feedback.getOverallFeedback());
        dto.setDetails(feedback.getDetails());
        dto.setStatus(feedback.getStatus().name());
        dto.setProcessorId(feedback.getProcessorId());
        dto.setProcessorName(feedback.getProcessorName());
        dto.setProcessTime(feedback.getProcessTime());
        dto.setProcessNote(feedback.getProcessNote());
        dto.setMeasurement(measurement != null ? convertMeasurementToDTO(measurement) : null);
        dto.setFabricCard(fabricCard != null ? convertFabricCardToDTO(fabricCard) : null);
        dto.setModifications(modifications != null ? modifications : new ArrayList<>());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setUpdatedAt(feedback.getUpdatedAt());

        return dto;
    }

    private MeasurementDTO convertMeasurementToDTO(Measurement measurement) {
        MeasurementDTO dto = new MeasurementDTO();
        dto.setId(measurement.getId());
        dto.setOrderId(measurement.getOrder().getId());
        dto.setMeasurerId(measurement.getMeasurerId());
        dto.setMeasurerName(measurement.getMeasurerName());
        dto.setBust(measurement.getBust());
        dto.setWaist(measurement.getWaist());
        dto.setHips(measurement.getHips());
        dto.setShoulderWidth(measurement.getShoulderWidth());
        dto.setSleeveLength(measurement.getSleeveLength());
        dto.setArmhole(measurement.getArmhole());
        dto.setBackLength(measurement.getBackLength());
        dto.setFrontLength(measurement.getFrontLength());
        dto.setNeckCircumference(measurement.getNeckCircumference());
        dto.setWristCircumference(measurement.getWristCircumference());
        dto.setThighCircumference(measurement.getThighCircumference());
        dto.setKneeCircumference(measurement.getKneeCircumference());
        dto.setInseamLength(measurement.getInseamLength());
        dto.setOutseamLength(measurement.getOutseamLength());
        dto.setMeasurementDate(measurement.getMeasurementDate());
        dto.setNotes(measurement.getNotes());
        dto.setCreatedAt(measurement.getCreatedAt());
        return dto;
    }

    private FabricCardDTO convertFabricCardToDTO(FabricCard fabricCard) {
        FabricCardDTO dto = new FabricCardDTO();
        dto.setId(fabricCard.getId());
        dto.setFabricCode(fabricCard.getFabricCode());
        dto.setFabricName(fabricCard.getFabricName());
        dto.setFabricType(fabricCard.getFabricType());
        dto.setColor(fabricCard.getColor());
        dto.setPattern(fabricCard.getPattern());
        dto.setWidth(fabricCard.getWidth());
        dto.setDescription(fabricCard.getDescription());
        dto.setCreatedAt(fabricCard.getCreatedAt());
        return dto;
    }
}