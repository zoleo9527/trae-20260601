package com.eyeclinic.surgerycenter.service;

import com.eyeclinic.surgerycenter.dto.PreoperativeCheckDTO;
import com.eyeclinic.surgerycenter.entity.PreoperativeCheck;
import com.eyeclinic.surgerycenter.entity.User;
import com.eyeclinic.surgerycenter.entity.WorkflowInstance;
import com.eyeclinic.surgerycenter.enums.CheckItemStatus;
import com.eyeclinic.surgerycenter.enums.CheckItemType;
import com.eyeclinic.surgerycenter.enums.ErrorCode;
import com.eyeclinic.surgerycenter.enums.RoleType;
import com.eyeclinic.surgerycenter.exception.BusinessException;
import com.eyeclinic.surgerycenter.repository.PreoperativeCheckRepository;
import com.eyeclinic.surgerycenter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PreoperativeCheckService {

    private final PreoperativeCheckRepository checkRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<PreoperativeCheck> initializeCheckItems(WorkflowInstance workflow) {
        List<PreoperativeCheck> checkItems = new ArrayList<>();
        for (CheckItemType type : CheckItemType.values()) {
            PreoperativeCheck check = new PreoperativeCheck();
            check.setWorkflow(workflow);
            check.setCheckType(type);
            check.setStatus(CheckItemStatus.PENDING);
            checkItems.add(check);
        }
        return checkRepository.saveAll(checkItems);
    }

    @Transactional
    public PreoperativeCheck updateCheckItem(PreoperativeCheckDTO.UpdateRequest request) {
        PreoperativeCheck check = checkRepository.findById(request.getCheckId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "检查项不存在"));

        User operator = userRepository.findById(request.getOperatorId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "操作人不存在"));

        if (operator.getRole() != RoleType.SPECIALIST) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED, "只有专业人员可以更新检查结果");
        }

        check.setStatus(request.getStatus());
        check.setCheckResult(request.getCheckResult());
        check.setMeasurementValue(request.getMeasurementValue());
        check.setReferenceRange(request.getReferenceRange());
        check.setRemarks(request.getRemarks());
        check.setAttachmentUrl(request.getAttachmentUrl());

        if (request.getStatus() == CheckItemStatus.COMPLETED || request.getStatus() == CheckItemStatus.ABNORMAL) {
            check.setCheckedBy(operator);
            check.setCheckedAt(LocalDateTime.now());
        }

        return checkRepository.save(check);
    }

    public List<PreoperativeCheck> getCheckItems(WorkflowInstance workflow) {
        return checkRepository.findByWorkflowOrderByCreatedAtAsc(workflow);
    }

    public boolean isAllChecksCompleted(WorkflowInstance workflow) {
        long incompleteCount = checkRepository.countByWorkflowAndStatusNot(workflow, CheckItemStatus.COMPLETED);
        return incompleteCount == 0;
    }

    public void validateChecksCompleted(WorkflowInstance workflow) {
        if (!isAllChecksCompleted(workflow)) {
            List<PreoperativeCheck> incomplete = checkRepository.findByWorkflowAndStatus(workflow, CheckItemStatus.PENDING);
            StringBuilder sb = new StringBuilder("以下检查项未完成：");
            for (PreoperativeCheck check : incomplete) {
                sb.append(check.getCheckType().getDescription()).append("、");
            }
            throw new BusinessException(ErrorCode.CHECK_ITEM_INCOMPLETE, sb.substring(0, sb.length() - 1));
        }
    }

    public List<PreoperativeCheckDTO.DetailVO> convertToVO(List<PreoperativeCheck> checks) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return checks.stream().map(check -> {
            PreoperativeCheckDTO.DetailVO vo = new PreoperativeCheckDTO.DetailVO();
            vo.setId(check.getId());
            vo.setCheckType(check.getCheckType());
            vo.setCheckTypeName(check.getCheckType().getDescription());
            vo.setStatus(check.getStatus());
            vo.setStatusName(check.getStatus().getDescription());
            vo.setCheckResult(check.getCheckResult());
            vo.setMeasurementValue(check.getMeasurementValue());
            vo.setReferenceRange(check.getReferenceRange());
            vo.setCheckedByName(check.getCheckedBy() != null ? check.getCheckedBy().getRealName() : null);
            vo.setCheckedAt(check.getCheckedAt() != null ? check.getCheckedAt().format(formatter) : null);
            vo.setRemarks(check.getRemarks());
            vo.setAttachmentUrl(check.getAttachmentUrl());
            return vo;
        }).toList();
    }
}
