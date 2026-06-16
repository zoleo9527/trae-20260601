package com.example.tailor.service;

import com.example.tailor.dto.request.CreateModificationRequest;
import com.example.tailor.dto.request.ModificationQueryRequest;
import com.example.tailor.dto.request.UpdateModificationRequest;
import com.example.tailor.dto.response.ModificationRecordDTO;
import com.example.tailor.dto.response.PageResponse;
import com.example.tailor.entity.FittingFeedback;
import com.example.tailor.entity.ModificationRecord;
import com.example.tailor.enums.ModificationStatus;
import com.example.tailor.exception.BusinessException;
import com.example.tailor.repository.FittingFeedbackRepository;
import com.example.tailor.repository.ModificationRecordRepository;
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
    private final NotificationService notificationService;

    public ModificationRecordService(ModificationRecordRepository modificationRecordRepository,
                                     FittingFeedbackRepository feedbackRepository,
                                     NotificationService notificationService) {
        this.modificationRecordRepository = modificationRecordRepository;
        this.feedbackRepository = feedbackRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ModificationRecordDTO createModification(CreateModificationRequest request) {
        FittingFeedback feedback = feedbackRepository.findById(request.getFeedbackId())
                .orElseThrow(() -> new BusinessException("试衣反馈不存在：" + request.getFeedbackId()));

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
        modification.setRelatedMeasurementFields(request.getRelatedMeasurementFields());
        modification.setRelatedFabricInfo(request.getRelatedFabricInfo());

        ModificationRecord saved = modificationRecordRepository.save(modification);

        notificationService.triggerModificationCreated(saved.getId(), modificationNo,
                feedback.getId(), feedback.getFeedbackNo(), request.getResponsibleRole());

        return convertToDTO(saved);
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
        }

        return convertToDTO(saved);
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
}