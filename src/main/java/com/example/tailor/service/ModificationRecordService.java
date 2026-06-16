package com.example.tailor.service;

import com.example.tailor.dto.request.CreateModificationRequest;
import com.example.tailor.dto.request.ModificationQueryRequest;
import com.example.tailor.dto.request.UpdateModificationRequest;
import com.example.tailor.dto.response.*;
import com.example.tailor.entity.FabricCard;
import com.example.tailor.entity.FittingFeedback;
import com.example.tailor.entity.Measurement;
import com.example.tailor.entity.ModificationRecord;
import com.example.tailor.enums.FeedbackStatus;
import com.example.tailor.enums.ModificationStatus;
import com.example.tailor.exception.BusinessException;
import com.example.tailor.repository.*;
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
public class ModificationRecordService {

    private final ModificationRecordRepository modificationRecordRepository;
    private final FittingFeedbackRepository feedbackRepository;
    private final OrderRepository orderRepository;
    private final MeasurementRepository measurementRepository;
    private final FabricCardRepository fabricCardRepository;
    private final NotificationService notificationService;

    public ModificationRecordService(ModificationRecordRepository modificationRecordRepository,
                                     FittingFeedbackRepository feedbackRepository,
                                     OrderRepository orderRepository,
                                     MeasurementRepository measurementRepository,
                                     FabricCardRepository fabricCardRepository,
                                     NotificationService notificationService) {
        this.modificationRecordRepository = modificationRecordRepository;
        this.feedbackRepository = feedbackRepository;
        this.orderRepository = orderRepository;
        this.measurementRepository = measurementRepository;
        this.fabricCardRepository = fabricCardRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ModificationRecordDTO createModification(CreateModificationRequest request) {
        FittingFeedback feedback = feedbackRepository.findById(request.getFeedbackId())
                .orElseThrow(() -> new BusinessException("试衣反馈不存在：" + request.getFeedbackId()));

        Measurement measurement = measurementRepository.findByOrderId(feedback.getOrder().getId()).orElse(null);
        FabricCard fabricCard = fabricCardRepository.findById(feedback.getOrder().getFabricCard().getId()).orElse(null);

        String modificationNo = generateModificationNo();

        ModificationRecord modification = new ModificationRecord();
        modification.setFeedback(feedback);
        modification.setOrderId(feedback.getOrder().getId());
        modification.setOrderNo(feedback.getOrder().getOrderNo());
        modification.setModificationNo(modificationNo);
        modification.setModificationType(request.getModificationType());
        modification.setDescription(request.getDescription());
        modification.setAffectedPart(request.getAffectedPart());
        modification.setOriginalValue(request.getOriginalValue());
        modification.setTargetValue(request.getTargetValue());
        modification.setResponsibleRole(request.getResponsibleRole());
        modification.setAssigneeId(request.getAssigneeId());
        modification.setAssigneeName(request.getAssigneeName());
        modification.setStatus(ModificationStatus.PENDING);
        modification.setPriority(request.getPriority());

        if (request.getRelatedMeasurementFields() != null && !request.getRelatedMeasurementFields().isEmpty()) {
            modification.setRelatedMeasurementFields(request.getRelatedMeasurementFields());
        } else if (measurement != null) {
            StringBuilder measurementFields = new StringBuilder();
            if (measurement.getBust() != null) measurementFields.append("胸围:").append(measurement.getBust()).append(";");
            if (measurement.getWaist() != null) measurementFields.append("腰围:").append(measurement.getWaist()).append(";");
            if (measurement.getHips() != null) measurementFields.append("臀围:").append(measurement.getHips()).append(";");
            if (measurement.getShoulderWidth() != null) measurementFields.append("肩宽:").append(measurement.getShoulderWidth()).append(";");
            if (measurement.getSleeveLength() != null) measurementFields.append("袖长:").append(measurement.getSleeveLength()).append(";");
            if (measurement.getArmhole() != null) measurementFields.append("袖窿:").append(measurement.getArmhole()).append(";");
            if (measurement.getBackLength() != null) measurementFields.append("背长:").append(measurement.getBackLength()).append(";");
            if (measurement.getFrontLength() != null) measurementFields.append("前长:").append(measurement.getFrontLength()).append(";");
            if (measurement.getNeckCircumference() != null) measurementFields.append("领围:").append(measurement.getNeckCircumference()).append(";");
            if (measurement.getWristCircumference() != null) measurementFields.append("腕围:").append(measurement.getWristCircumference()).append(";");
            if (measurement.getThighCircumference() != null) measurementFields.append("大腿围:").append(measurement.getThighCircumference()).append(";");
            if (measurement.getKneeCircumference() != null) measurementFields.append("膝围:").append(measurement.getKneeCircumference()).append(";");
            if (measurement.getInseamLength() != null) measurementFields.append("内长:").append(measurement.getInseamLength()).append(";");
            if (measurement.getOutseamLength() != null) measurementFields.append("外长:").append(measurement.getOutseamLength()).append(";");
            if (measurement.getNotes() != null) measurementFields.append("备注:").append(measurement.getNotes());
            modification.setRelatedMeasurementFields(measurementFields.toString());
        }

        if (request.getRelatedFabricInfo() != null && !request.getRelatedFabricInfo().isEmpty()) {
            modification.setRelatedFabricInfo(request.getRelatedFabricInfo());
        } else if (fabricCard != null) {
            StringBuilder fabricInfo = new StringBuilder();
            fabricInfo.append("面料编码:").append(fabricCard.getFabricCode()).append(";");
            fabricInfo.append("面料名称:").append(fabricCard.getFabricName()).append(";");
            fabricInfo.append("面料类型:").append(fabricCard.getFabricType()).append(";");
            fabricInfo.append("颜色:").append(fabricCard.getColor()).append(";");
            fabricInfo.append("花型:").append(fabricCard.getPattern()).append(";");
            fabricInfo.append("幅宽:").append(fabricCard.getWidth()).append(";");
            if (fabricCard.getDescription() != null) {
                fabricInfo.append("描述:").append(fabricCard.getDescription());
            }
            modification.setRelatedFabricInfo(fabricInfo.toString());
        }

        ModificationRecord saved = modificationRecordRepository.save(modification);

        notificationService.triggerModificationCreated(saved.getId(), modificationNo,
                feedback.getId(), feedback.getFeedbackNo(), request.getResponsibleRole());

        syncFeedbackStatusOnCreation(saved);

        return convertToDTO(saved);
    }

    private void syncFeedbackStatusOnCreation(ModificationRecord modification) {
        FittingFeedback feedback = modification.getFeedback();
        if (feedback.getStatus() == FeedbackStatus.PENDING) {
            feedback.setStatus(FeedbackStatus.PROCESSING);
            feedbackRepository.save(feedback);
            notificationService.triggerFeedbackProcessed(feedback.getId(), feedback.getFeedbackNo(),
                    feedback.getOrder().getId(), feedback.getOrder().getOrderNo(), "系统");
        }
    }

    public ModificationDetailDTO getModificationDetailById(Long id) {
        ModificationRecord modification = modificationRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException("修改记录不存在：" + id));
        return convertToDetailDTO(modification);
    }

    public ModificationDetailDTO getModificationDetailByNo(String modificationNo) {
        ModificationRecord modification = modificationRecordRepository.findByModificationNo(modificationNo)
                .orElseThrow(() -> new BusinessException("修改记录不存在：" + modificationNo));
        return convertToDetailDTO(modification);
    }

    public ModificationRecordDTO getModificationById(Long id) {
        ModificationRecord modification = modificationRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException("修改记录不存在：" + id));
        return convertToDTO(modification);
    }

    public ModificationRecordDTO getModificationByNo(String modificationNo) {
        ModificationRecord modification = modificationRecordRepository.findByModificationNo(modificationNo)
                .orElseThrow(() -> new BusinessException("修改记录不存在：" + modificationNo));
        return convertToDTO(modification);
    }

    public List<ModificationRecordDTO> getByFeedbackId(Long feedbackId) {
        List<ModificationRecord> modifications = modificationRecordRepository.findByFeedbackId(feedbackId);
        if (modifications == null) {
            return new ArrayList<>();
        }
        return modifications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<ModificationDetailDTO> getDetailsByFeedbackId(Long feedbackId) {
        List<ModificationRecord> modifications = modificationRecordRepository.findByFeedbackId(feedbackId);
        if (modifications == null) {
            return new ArrayList<>();
        }
        return modifications.stream().map(this::convertToDetailDTO).collect(Collectors.toList());
    }

    @Transactional
    public ModificationRecordDTO updateModification(Long id, UpdateModificationRequest request) {
        ModificationRecord modification = modificationRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException("修改记录不存在：" + id));

        String oldStatus = modification.getStatus().name();

        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                ModificationStatus newStatus = ModificationStatus.valueOf(request.getStatus().toUpperCase());
                modification.setStatus(newStatus);

                if (newStatus == ModificationStatus.IN_PROGRESS) {
                    modification.setStartTime(LocalDateTime.now());
                } else if (newStatus == ModificationStatus.COMPLETED) {
                    modification.setCompleteTime(LocalDateTime.now());
                } else if (newStatus == ModificationStatus.VERIFIED) {
                    modification.setVerifyTime(LocalDateTime.now());
                }
            } catch (IllegalArgumentException e) {
                throw new BusinessException("无效的状态值：" + request.getStatus());
            }
        }

        if (request.getDescription() != null) {
            modification.setDescription(request.getDescription());
        }
        if (request.getAffectedPart() != null) {
            modification.setAffectedPart(request.getAffectedPart());
        }
        if (request.getTargetValue() != null) {
            modification.setTargetValue(request.getTargetValue());
        }
        if (request.getAssigneeId() != null) {
            modification.setAssigneeId(request.getAssigneeId());
        }
        if (request.getAssigneeName() != null) {
            modification.setAssigneeName(request.getAssigneeName());
        }
        if (request.getPriority() != null) {
            modification.setPriority(request.getPriority());
        }
        if (request.getActualValue() != null) {
            modification.setActualValue(request.getActualValue());
        }
        if (request.getVerifierId() != null) {
            modification.setVerifierId(request.getVerifierId());
        }
        if (request.getVerifierName() != null) {
            modification.setVerifierName(request.getVerifierName());
        }
        if (request.getVerifyNote() != null) {
            modification.setVerifyNote(request.getVerifyNote());
        }

        ModificationRecord saved = modificationRecordRepository.save(modification);

        String newStatus = saved.getStatus().name();
        if (!oldStatus.equals(newStatus)) {
            notificationService.triggerModificationStatusChanged(saved.getId(), saved.getModificationNo(),
                    newStatus, saved.getAssigneeId(), saved.getAssigneeName());

            syncFeedbackStatus(saved);
        }

        return convertToDTO(saved);
    }

    private void syncFeedbackStatus(ModificationRecord modification) {
        FittingFeedback feedback = modification.getFeedback();
        ModificationStatus newStatus = modification.getStatus();
        
        if (newStatus == ModificationStatus.COMPLETED) {
            boolean allCompleted = modificationRecordRepository.findByFeedbackId(feedback.getId()).stream()
                    .allMatch(m -> m.getStatus() == ModificationStatus.COMPLETED || 
                                   m.getStatus() == ModificationStatus.VERIFIED);
            if (allCompleted && feedback.getStatus() != FeedbackStatus.PROCESSING) {
                feedback.setStatus(FeedbackStatus.PROCESSING);
                feedbackRepository.save(feedback);
                notificationService.triggerFeedbackProcessed(feedback.getId(), feedback.getFeedbackNo(),
                        feedback.getOrder().getId(), feedback.getOrder().getOrderNo(),
                        modification.getAssigneeName() != null ? modification.getAssigneeName() : "系统");
            }
        } else if (newStatus == ModificationStatus.VERIFIED) {
            List<ModificationRecord> allModifications = modificationRecordRepository.findByFeedbackId(feedback.getId());
            boolean allVerified = allModifications.stream()
                    .allMatch(m -> m.getStatus() == ModificationStatus.VERIFIED);
            
            if (allVerified && feedback.getStatus() != FeedbackStatus.RESOLVED) {
                feedback.setStatus(FeedbackStatus.RESOLVED);
                feedbackRepository.save(feedback);
                
                notificationService.triggerFeedbackProcessed(feedback.getId(), feedback.getFeedbackNo(),
                        feedback.getOrder().getId(), feedback.getOrder().getOrderNo(),
                        modification.getVerifierName() != null ? modification.getVerifierName() : "系统");
            }
        }
    }

    public PageResponse<ModificationRecordDTO> queryModifications(ModificationQueryRequest request) {
        Pageable pageable = PageRequest.of(
                request.getPage() != null ? request.getPage() : 0,
                request.getSize() != null ? request.getSize() : 10,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<ModificationRecord> page;

        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                ModificationStatus status = ModificationStatus.valueOf(request.getStatus().toUpperCase());
                page = modificationRecordRepository.findByStatus(status, pageable);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("无效的状态值：" + request.getStatus());
            }
        } else if (request.getFeedbackId() != null) {
            page = modificationRecordRepository.findByFeedbackId(request.getFeedbackId(), pageable);
        } else if (request.getOrderId() != null) {
            page = modificationRecordRepository.findByOrderId(request.getOrderId(), pageable);
        } else if (request.getResponsibleRole() != null && !request.getResponsibleRole().isEmpty()) {
            page = modificationRecordRepository.findByResponsibleRole(request.getResponsibleRole().toUpperCase(), pageable);
        } else if (request.getAssigneeId() != null) {
            page = modificationRecordRepository.findByAssigneeId(request.getAssigneeId(), pageable);
        } else {
            page = modificationRecordRepository.findAll(pageable);
        }

        List<ModificationRecordDTO> content = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResponse<ModificationRecordDTO> response = new PageResponse<>();
        response.setContent(content);
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());

        return response;
    }

    public PageResponse<ModificationDetailDTO> queryModificationDetails(ModificationQueryRequest request) {
        Pageable pageable = PageRequest.of(
                request.getPage() != null ? request.getPage() : 0,
                request.getSize() != null ? request.getSize() : 10,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<ModificationRecord> page;

        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                ModificationStatus status = ModificationStatus.valueOf(request.getStatus().toUpperCase());
                page = modificationRecordRepository.findByStatus(status, pageable);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("无效的状态值：" + request.getStatus());
            }
        } else if (request.getFeedbackId() != null) {
            page = modificationRecordRepository.findByFeedbackId(request.getFeedbackId(), pageable);
        } else if (request.getOrderId() != null) {
            page = modificationRecordRepository.findByOrderId(request.getOrderId(), pageable);
        } else if (request.getResponsibleRole() != null && !request.getResponsibleRole().isEmpty()) {
            page = modificationRecordRepository.findByResponsibleRole(request.getResponsibleRole().toUpperCase(), pageable);
        } else if (request.getAssigneeId() != null) {
            page = modificationRecordRepository.findByAssigneeId(request.getAssigneeId(), pageable);
        } else {
            page = modificationRecordRepository.findAll(pageable);
        }

        List<ModificationDetailDTO> content = page.getContent().stream()
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());

        PageResponse<ModificationDetailDTO> response = new PageResponse<>();
        response.setContent(content);
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());

        return response;
    }

    private String generateModificationNo() {
        return "MD" + System.currentTimeMillis();
    }

    private ModificationRecordDTO convertToDTO(ModificationRecord modification) {
        ModificationRecordDTO dto = new ModificationRecordDTO();
        dto.setId(modification.getId());
        dto.setFeedbackId(modification.getFeedback().getId());
        dto.setFeedbackNo(modification.getFeedback().getFeedbackNo());
        dto.setOrderId(modification.getOrderId());
        dto.setOrderNo(modification.getOrderNo());
        dto.setModificationNo(modification.getModificationNo());
        dto.setModificationType(modification.getModificationType());
        dto.setDescription(modification.getDescription());
        dto.setAffectedPart(modification.getAffectedPart());
        dto.setOriginalValue(modification.getOriginalValue());
        dto.setTargetValue(modification.getTargetValue());
        dto.setResponsibleRole(modification.getResponsibleRole());
        dto.setAssigneeId(modification.getAssigneeId());
        dto.setAssigneeName(modification.getAssigneeName());
        dto.setStatus(modification.getStatus().name());
        dto.setPriority(modification.getPriority());
        dto.setStartTime(modification.getStartTime());
        dto.setCompleteTime(modification.getCompleteTime());
        dto.setActualValue(modification.getActualValue());
        dto.setVerifierId(modification.getVerifierId());
        dto.setVerifierName(modification.getVerifierName());
        dto.setVerifyTime(modification.getVerifyTime());
        dto.setVerifyNote(modification.getVerifyNote());
        dto.setRelatedMeasurementFields(modification.getRelatedMeasurementFields());
        dto.setRelatedFabricInfo(modification.getRelatedFabricInfo());
        dto.setCreatedAt(modification.getCreatedAt());
        dto.setUpdatedAt(modification.getUpdatedAt());
        return dto;
    }

    private ModificationDetailDTO convertToDetailDTO(ModificationRecord modification) {
        FittingFeedback feedback = modification.getFeedback();
        Measurement measurement = measurementRepository.findByOrderId(modification.getOrderId()).orElse(null);
        FabricCard fabricCard = fabricCardRepository.findById(feedback.getOrder().getFabricCard().getId()).orElse(null);

        ModificationDetailDTO dto = new ModificationDetailDTO();
        dto.setId(modification.getId());
        dto.setFeedbackId(feedback.getId());
        dto.setFeedbackNo(feedback.getFeedbackNo());
        dto.setFeedbackDetails(feedback.getDetails());
        dto.setFeedbackStatus(feedback.getStatus().name());
        dto.setOrderId(modification.getOrderId());
        dto.setOrderNo(modification.getOrderNo());
        dto.setProductName(feedback.getOrder().getProductName());
        dto.setProductType(feedback.getOrder().getProductType());
        dto.setModificationNo(modification.getModificationNo());
        dto.setModificationType(modification.getModificationType());
        dto.setDescription(modification.getDescription());
        dto.setAffectedPart(modification.getAffectedPart());
        dto.setOriginalValue(modification.getOriginalValue());
        dto.setTargetValue(modification.getTargetValue());
        dto.setResponsibleRole(modification.getResponsibleRole());
        dto.setAssigneeId(modification.getAssigneeId());
        dto.setAssigneeName(modification.getAssigneeName());
        dto.setStatus(modification.getStatus().name());
        dto.setPriority(modification.getPriority());
        dto.setStartTime(modification.getStartTime());
        dto.setCompleteTime(modification.getCompleteTime());
        dto.setActualValue(modification.getActualValue());
        dto.setVerifierId(modification.getVerifierId());
        dto.setVerifierName(modification.getVerifierName());
        dto.setVerifyTime(modification.getVerifyTime());
        dto.setVerifyNote(modification.getVerifyNote());
        dto.setCreatedAt(modification.getCreatedAt());
        dto.setUpdatedAt(modification.getUpdatedAt());
        dto.setMeasurement(measurement != null ? convertMeasurementToDTO(measurement) : null);
        dto.setFabricCard(fabricCard != null ? convertFabricCardToDTO(fabricCard) : null);
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