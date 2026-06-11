package com.park.decoration.service.impl;

import com.park.decoration.dto.ApiResponse;
import com.park.decoration.dto.EntryPermitDTO;
import com.park.decoration.dto.EntryPermitRequest;
import com.park.decoration.entity.DecorationApplication;
import com.park.decoration.entity.EntryPermit;
import com.park.decoration.entity.OperationLog;
import com.park.decoration.enums.ApplicationStatus;
import com.park.decoration.enums.PermitStatus;
import com.park.decoration.repository.DecorationApplicationRepository;
import com.park.decoration.repository.EntryPermitRepository;
import com.park.decoration.repository.OperationLogRepository;
import com.park.decoration.service.EntryPermitService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EntryPermitServiceImpl implements EntryPermitService {

    private final EntryPermitRepository permitRepository;
    private final DecorationApplicationRepository applicationRepository;
    private final OperationLogRepository logRepository;

    @Override
    @Transactional
    public EntryPermitDTO issuePermit(EntryPermitRequest request) {
        DecorationApplication app = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new EntityNotFoundException("申请不存在，ID：" + request.getApplicationId()));

        EntryPermit permit = new EntryPermit();
        BeanUtils.copyProperties(request, permit);
        permit.setPermitNo(generatePermitNo());
        permit.setApplication(app);
        permit.setStatus(PermitStatus.APPROVED);
        permit.setIssuedAt(LocalDateTime.now());

        EntryPermit saved = permitRepository.save(permit);

        app.setStatus(ApplicationStatus.PERMIT_ISSUED);
        app.setUpdatedBy(request.getIssuedBy());
        applicationRepository.save(app);

        addLog(app, "ISSUE_PERMIT", "status", app.getStatus().name(),
               ApplicationStatus.PERMIT_ISSUED.name(),
               "签发进场许可，许可证号：" + saved.getPermitNo(), request.getIssuedBy());

        return convertToDTO(saved);
    }

    @Override
    public EntryPermitDTO getPermitById(Long id) {
        EntryPermit permit = permitRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("进场许可不存在，ID：" + id));
        return convertToDTO(permit);
    }

    @Override
    public EntryPermitDTO getPermitByNo(String permitNo) {
        EntryPermit permit = permitRepository.findByPermitNo(permitNo)
                .orElseThrow(() -> new EntityNotFoundException("进场许可不存在，证号：" + permitNo));
        return convertToDTO(permit);
    }

    @Override
    public List<EntryPermitDTO> getPermitsByApplicationId(Long applicationId) {
        return permitRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public EntryPermitDTO getLatestPermit(Long applicationId) {
        return permitRepository.findTopByApplicationIdOrderByCreatedAtDesc(applicationId)
                .map(this::convertToDTO).orElse(null);
    }

    @Override
    @Transactional
    public EntryPermitDTO revokePermit(Long id, String reason, String operator) {
        EntryPermit permit = permitRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("进场许可不存在，ID：" + id));

        permit.setStatus(PermitStatus.REVOKED);
        permit.setRevokeReason(reason);
        permit.setRevokedAt(LocalDateTime.now());
        permit.setRevokedBy(operator);

        EntryPermit saved = permitRepository.save(permit);

        DecorationApplication app = permit.getApplication();
        addLog(app, "REVOKE_PERMIT", "permitStatus", PermitStatus.APPROVED.name(),
               PermitStatus.REVOKED.name(), "撤销进场许可，原因：" + reason, operator);

        return convertToDTO(saved);
    }

    private String generatePermitNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "EP-" + dateStr + "-" + uuid;
    }

    private void addLog(DecorationApplication app, String type, String field,
                        String oldVal, String newVal, String remark, String operator) {
        OperationLog log = OperationLog.builder()
                .application(app)
                .operationType(type)
                .fieldName(field)
                .oldValue(oldVal)
                .newValue(newVal)
                .remark(remark)
                .operator(operator)
                .operatedAt(LocalDateTime.now())
                .build();
        logRepository.save(log);
    }

    private EntryPermitDTO convertToDTO(EntryPermit p) {
        EntryPermitDTO dto = new EntryPermitDTO();
        BeanUtils.copyProperties(p, dto);
        dto.setApplicationId(p.getApplication().getId());
        dto.setApplicationNo(p.getApplication().getApplicationNo());
        return dto;
    }
}
