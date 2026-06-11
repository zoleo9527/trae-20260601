package com.park.decoration.service.impl;

import com.park.decoration.dto.ExceptionNoteDTO;
import com.park.decoration.dto.ExceptionReportRequest;
import com.park.decoration.dto.ExceptionResolveRequest;
import com.park.decoration.entity.DecorationApplication;
import com.park.decoration.entity.ExceptionNote;
import com.park.decoration.entity.OperationLog;
import com.park.decoration.repository.DecorationApplicationRepository;
import com.park.decoration.repository.ExceptionNoteRepository;
import com.park.decoration.repository.OperationLogRepository;
import com.park.decoration.service.ExceptionNoteService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExceptionNoteServiceImpl implements ExceptionNoteService {

    private final ExceptionNoteRepository exceptionRepository;
    private final DecorationApplicationRepository applicationRepository;
    private final OperationLogRepository logRepository;

    @Override
    @Transactional
    public ExceptionNoteDTO reportException(ExceptionReportRequest request) {
        DecorationApplication app = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new EntityNotFoundException("申请不存在，ID：" + request.getApplicationId()));

        ExceptionNote ex = ExceptionNote.builder()
                .application(app)
                .applicationNo(app.getApplicationNo())
                .title(request.getTitle())
                .description(request.getDescription())
                .impact(request.getImpact())
                .responsiblePerson(request.getResponsiblePerson())
                .attachmentUrls(request.getAttachmentUrls())
                .reportedBy(request.getReportedBy())
                .reportedAt(LocalDateTime.now())
                .resolved(false)
                .build();

        ExceptionNote saved = exceptionRepository.save(ex);

        app.setUpdatedAt(LocalDateTime.now());
        app.setUpdatedBy(request.getReportedBy());
        applicationRepository.save(app);

        addLog(app, "EXCEPTION_REPORTED", "exception", null, saved.getTitle(),
               "上报异常：" + saved.getTitle()
                       + (saved.getResponsiblePerson() != null ? "，责任人：" + saved.getResponsiblePerson() : ""),
               request.getReportedBy());

        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public ExceptionNoteDTO resolveException(Long id, ExceptionResolveRequest request) {
        ExceptionNote ex = exceptionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("异常记录不存在，ID：" + id));

        if (Boolean.TRUE.equals(ex.getResolved())) {
            throw new IllegalStateException("该异常已解决，无需重复处置");
        }

        ex.setResolution(request.getResolution());
        ex.setResolvedBy(request.getResolvedBy());
        ex.setResolvedAt(LocalDateTime.now());
        ex.setResolved(true);

        ExceptionNote saved = exceptionRepository.save(ex);

        DecorationApplication app = applicationRepository.findById(saved.getApplicationId())
                .orElse(null);
        if (app != null) {
            app.setUpdatedAt(LocalDateTime.now());
            app.setUpdatedBy(request.getResolvedBy());
            applicationRepository.save(app);

            addLog(app, "EXCEPTION_RESOLVED", "exception", saved.getTitle(), "已解决",
                   "解决异常【" + saved.getTitle() + "】：" + request.getResolution(),
                   request.getResolvedBy());
        }

        return convertToDTO(saved);
    }

    @Override
    public ExceptionNoteDTO getExceptionById(Long id) {
        ExceptionNote ex = exceptionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("异常记录不存在，ID：" + id));
        return convertToDTO(ex);
    }

    @Override
    public List<ExceptionNoteDTO> getExceptionsByApplicationId(Long applicationId) {
        return exceptionRepository.findByApplicationIdOrderByReportedAtDesc(applicationId)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public List<ExceptionNoteDTO> getUnresolvedExceptions() {
        return exceptionRepository.findByResolvedFalseOrderByReportedAtDesc()
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private void addLog(DecorationApplication app, String type, String field,
                        String oldVal, String newVal, String remark, String operator) {
        OperationLog log = OperationLog.builder()
                .application(app)
                .applicationNo(app.getApplicationNo())
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

    private ExceptionNoteDTO convertToDTO(ExceptionNote e) {
        ExceptionNoteDTO dto = new ExceptionNoteDTO();
        BeanUtils.copyProperties(e, dto);
        dto.setApplicationId(e.getApplicationId());
        dto.setApplicationNo(e.getApplicationNo());
        return dto;
    }
}
