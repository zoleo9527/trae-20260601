package com.example.tailor.service;

import com.example.tailor.dto.response.RoleTodoResponse;
import com.example.tailor.dto.response.TodoTaskDTO;
import com.example.tailor.entity.FittingFeedback;
import com.example.tailor.entity.ModificationRecord;
import com.example.tailor.enums.FeedbackStatus;
import com.example.tailor.enums.ModificationStatus;
import com.example.tailor.enums.Role;
import com.example.tailor.repository.FittingFeedbackRepository;
import com.example.tailor.repository.ModificationRecordRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleTodoService {

    private final FittingFeedbackRepository feedbackRepository;
    private final ModificationRecordRepository modificationRecordRepository;

    public RoleTodoService(FittingFeedbackRepository feedbackRepository,
                          ModificationRecordRepository modificationRecordRepository) {
        this.feedbackRepository = feedbackRepository;
        this.modificationRecordRepository = modificationRecordRepository;
    }

    public RoleTodoResponse getTodoByRole(String role) {
        Role roleEnum;
        try {
            roleEnum = Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("无效的角色值：" + role);
        }

        List<TodoTaskDTO> feedbackTasks = getFeedbackTasksByRole(roleEnum);
        List<TodoTaskDTO> modificationTasks = getModificationTasksByRole(roleEnum);

        return new RoleTodoResponse(roleEnum.name(), feedbackTasks, modificationTasks);
    }

    private List<TodoTaskDTO> getFeedbackTasksByRole(Role role) {
        List<FittingFeedback> feedbacks = new ArrayList<>();

        switch (role) {
            case CUSTOMER_SERVICE:
                feedbacks = feedbackRepository.findByStatus(FeedbackStatus.PENDING);
                break;
            case MEASURER:
                feedbacks = feedbackRepository.findByStatus(FeedbackStatus.PROCESSING);
                break;
            case PATTERN_MAKER:
                feedbacks = feedbackRepository.findByStatus(FeedbackStatus.PROCESSING);
                break;
            default:
                break;
        }

        return feedbacks.stream().map(this::convertFeedbackToTaskDTO).collect(Collectors.toList());
    }

    private List<TodoTaskDTO> getModificationTasksByRole(Role role) {
        List<ModificationRecord> modifications = new ArrayList<>();

        switch (role) {
            case MEASURER:
                modifications = modificationRecordRepository.findByResponsibleRoleAndStatus(
                        Role.MEASURER.name(), ModificationStatus.PENDING);
                modifications.addAll(modificationRecordRepository.findByResponsibleRoleAndStatus(
                        Role.MEASURER.name(), ModificationStatus.IN_PROGRESS));
                break;
            case PATTERN_MAKER:
                modifications = modificationRecordRepository.findByResponsibleRoleAndStatus(
                        Role.PATTERN_MAKER.name(), ModificationStatus.PENDING);
                modifications.addAll(modificationRecordRepository.findByResponsibleRoleAndStatus(
                        Role.PATTERN_MAKER.name(), ModificationStatus.IN_PROGRESS));
                break;
            case CUSTOMER_SERVICE:
                modifications = modificationRecordRepository.findByStatus(ModificationStatus.VERIFIED);
                break;
            default:
                break;
        }

        return modifications.stream().map(this::convertModificationToTaskDTO).collect(Collectors.toList());
    }

    private TodoTaskDTO convertFeedbackToTaskDTO(FittingFeedback feedback) {
        TodoTaskDTO dto = new TodoTaskDTO();
        dto.setId(feedback.getId());
        dto.setTaskNo(feedback.getFeedbackNo());
        dto.setTaskType("FEEDBACK");
        dto.setTitle("试衣反馈处理");
        dto.setDescription(feedback.getDetails());
        dto.setStatus(feedback.getStatus().name());
        dto.setPriority("MEDIUM");
        dto.setResponsibleRole("CUSTOMER_SERVICE");
        dto.setAssigneeId(feedback.getProcessorId());
        dto.setAssigneeName(feedback.getProcessorName());
        dto.setOrderId(feedback.getOrder().getId());
        dto.setOrderNo(feedback.getOrder().getOrderNo());
        dto.setProductName(feedback.getOrder().getProductName());
        dto.setFeedbackId(feedback.getId());
        dto.setFeedbackNo(feedback.getFeedbackNo());
        dto.setCustomerName(feedback.getCustomerName());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setUpdatedAt(feedback.getUpdatedAt());
        return dto;
    }

    private TodoTaskDTO convertModificationToTaskDTO(ModificationRecord modification) {
        TodoTaskDTO dto = new TodoTaskDTO();
        dto.setId(modification.getId());
        dto.setTaskNo(modification.getModificationNo());
        dto.setTaskType("MODIFICATION");
        dto.setTitle(modification.getModificationType());
        dto.setDescription(modification.getDescription());
        dto.setStatus(modification.getStatus().name());
        dto.setPriority(modification.getPriority() != null ? modification.getPriority() : "MEDIUM");
        dto.setResponsibleRole(modification.getResponsibleRole());
        dto.setAssigneeId(modification.getAssigneeId());
        dto.setAssigneeName(modification.getAssigneeName());
        dto.setOrderId(modification.getOrderId());
        dto.setOrderNo(modification.getOrderNo());
        dto.setFeedbackId(modification.getFeedback().getId());
        dto.setFeedbackNo(modification.getFeedback().getFeedbackNo());
        dto.setCustomerName(modification.getFeedback().getCustomerName());
        dto.setCreatedAt(modification.getCreatedAt());
        dto.setUpdatedAt(modification.getUpdatedAt());
        return dto;
    }
}