package com.medical.aesthetic.service;

import com.medical.aesthetic.context.UserContext;
import com.medical.aesthetic.entity.CustomerProject;
import com.medical.aesthetic.entity.Employee;
import com.medical.aesthetic.entity.HistoryNote;
import com.medical.aesthetic.repository.CustomerProjectRepository;
import com.medical.aesthetic.repository.HistoryNoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HistoryNoteService {

    private final HistoryNoteRepository historyNoteRepository;
    private final CustomerProjectRepository customerProjectRepository;

    @Transactional
    public HistoryNote addNote(Long projectId, String noteType, String title, String content,
                               String fieldChanged, String oldValue, String newValue, String internalRemark) {
        CustomerProject project = customerProjectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + projectId));

        Employee operator = UserContext.getCurrentEmployee();

        HistoryNote note = HistoryNote.builder()
                .customerProject(project)
                .noteType(noteType)
                .title(title)
                .content(content)
                .fieldChanged(fieldChanged)
                .oldValue(oldValue)
                .newValue(newValue)
                .operator(operator)
                .operateTime(LocalDateTime.now())
                .internalRemark(internalRemark)
                .build();

        HistoryNote saved = historyNoteRepository.save(note);
        log.info("添加历史备注 - 项目ID: {}, 类型: {}, 操作人: {}", projectId, noteType,
                operator != null ? operator.getName() : "系统");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<HistoryNote> getProjectHistory(Long projectId) {
        return historyNoteRepository.findByCustomerProjectIdOrderByOperateTimeDesc(projectId);
    }

    @Transactional(readOnly = true)
    public List<HistoryNote> getProjectHistoryByType(Long projectId, String noteType) {
        return historyNoteRepository.findByCustomerProjectIdAndNoteTypeOrderByOperateTimeDesc(projectId, noteType);
    }

    @Transactional
    public void addStatusChangeNote(Long projectId, String oldStatus, String newStatus, String reason) {
        String content = String.format("状态从 [%s] 变更为 [%s]。原因：%s", oldStatus, newStatus, reason);
        addNote(projectId, "STATUS_CHANGE", "状态变更", content,
                "status", oldStatus, newStatus, null);
    }

    @Transactional
    public void addConsultationNote(Long projectId, String consultationContent) {
        addNote(projectId, "CONSULTATION", "咨询记录", consultationContent,
                null, null, null, null);
    }

    @Transactional
    public void addPromiseNote(Long projectId, String oldPromise, String newPromise) {
        String content = String.format("项目承诺已更新。新承诺：%s", newPromise);
        addNote(projectId, "PROMISE_CHANGE", "承诺内容变更", content,
                "promiseContent", oldPromise, newPromise, null);
    }

    @Transactional
    public void addMaterialNote(Long projectId, String materialName, int quantity, String operation) {
        String content = String.format("耗材[%s] %s，数量：%d", materialName, operation, quantity);
        addNote(projectId, "MATERIAL", "耗材操作", content,
                null, null, null, null);
    }

    @Transactional
    public void addPaymentNote(Long projectId, String paymentInfo) {
        addNote(projectId, "PAYMENT", "款项记录", paymentInfo,
                null, null, null, null);
    }

    @Transactional
    public void addComplaintNote(Long projectId, String complaintTitle, String handlingResult) {
        String content = String.format("投诉[%s] 处理结果：%s", complaintTitle, handlingResult);
        addNote(projectId, "COMPLAINT", "投诉处理", content,
                null, null, null, null);
    }

    @Transactional
    public void addScheduleNote(Long projectId, String scheduleInfo) {
        addNote(projectId, "SCHEDULE", "排期变更", scheduleInfo,
                null, null, null, null);
    }

    @Transactional
    public void addFollowUpNote(Long projectId, String followUpContent) {
        addNote(projectId, "FOLLOW_UP", "术后回访", followUpContent,
                null, null, null, null);
    }

    @Transactional
    public void addInternalNote(Long projectId, String noteContent, String internalRemark) {
        addNote(projectId, "INTERNAL", "内部备注", noteContent,
                null, null, null, internalRemark);
    }
}
