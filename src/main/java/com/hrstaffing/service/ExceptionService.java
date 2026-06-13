package com.hrstaffing.service;

import com.hrstaffing.common.PageResult;
import com.hrstaffing.common.auth.Role;
import com.hrstaffing.common.auth.UserContext;
import com.hrstaffing.common.exception.BizException;
import com.hrstaffing.dto.ExceptionCreateDTO;
import com.hrstaffing.dto.ExceptionQueryDTO;
import com.hrstaffing.dto.RejectExceptionDTO;
import com.hrstaffing.dto.SupplementSubmitDTO;
import com.hrstaffing.entity.*;
import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ScheduleStatus;
import com.hrstaffing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExceptionService {

    private final AttendanceExceptionRepository excRepo;
    private final AttendanceScheduleRepository scheduleRepo;
    private final RejectRecordRepository rejectRepo;
    private final SupplementRecordRepository supplementRepo;
    private final AttachmentRepository attachmentRepo;
    private final StateMachineService stateMachine;

    @Transactional
    public AttendanceException createException(ExceptionCreateDTO dto) {
        AttendanceSchedule s = scheduleRepo.findById(dto.getScheduleId())
                .orElseThrow(() -> new BizException("排班记录不存在"));
        if (s.getStatus() == ScheduleStatus.CONFIRMED) {
            throw new BizException("已确认的排班不可再提交异常");
        }
        Long current = UserContext.getCurrent().getUserId();
        if (!s.getRecruiterId().equals(current)) {
            throw new BizException("仅对应招聘专员可为此排班提交异常");
        }

        UserContext.CurrentUser user = UserContext.getCurrent();
        AttendanceException e = new AttendanceException();
        e.setScheduleId(s.getId());
        e.setEmployeeId(s.getEmployeeId());
        e.setEmployeeNo(s.getEmployeeNo());
        e.setEmployeeName(s.getEmployeeName());
        e.setExceptionDate(dto.getExceptionDate());
        e.setExceptionType(dto.getExceptionType());
        e.setDescription(dto.getDescription());
        e.setAffectedHours(dto.getAffectedHours());
        e.setSiteNote(dto.getSiteNote());
        e.setStatus(ExceptionStatus.PENDING);
        e.setRecruiterId(s.getRecruiterId());
        e.setRecruiterName(s.getRecruiterName());
        e.setSupervisorId(s.getSupervisorId());
        e.setSupervisorName(s.getSupervisorName());
        AttendanceException saved = excRepo.save(e);

        stateMachine.transitionSchedule(s, ScheduleStatus.EXCEPTION, user.getUserName());
        scheduleRepo.save(s);
        return saved;
    }

    public PageResult<AttendanceException> recruiterPage(ExceptionQueryDTO dto) {
        Long recruiterId = UserContext.getCurrent().getUserId();
        Pageable pageable = PageRequest.of(
                Math.max(dto.getPage() - 1, 0),
                dto.getSize(),
                Sort.by(Sort.Direction.DESC, "exceptionDate", "id")
        );
        Page<AttendanceException> pg = excRepo.searchPage(
                recruiterId, null, dto.getEmployeeId(), dto.getStatus(),
                dto.getExceptionType(), dto.getStartDate(), dto.getEndDate(), dto.getKeyword(), pageable
        );
        return PageResult.of(pg.getTotalElements(), dto.getPage(), dto.getSize(), pg.getContent());
    }

    public PageResult<AttendanceException> supervisorPage(ExceptionQueryDTO dto) {
        Long supervisorId = UserContext.getCurrent().getUserId();
        Pageable pageable = PageRequest.of(
                Math.max(dto.getPage() - 1, 0),
                dto.getSize(),
                Sort.by(Sort.Direction.DESC, "exceptionDate", "id")
        );
        Page<AttendanceException> pg = excRepo.searchPage(
                null, supervisorId, dto.getEmployeeId(), dto.getStatus(),
                dto.getExceptionType(), dto.getStartDate(), dto.getEndDate(), dto.getKeyword(), pageable
        );
        return PageResult.of(pg.getTotalElements(), dto.getPage(), dto.getSize(), pg.getContent());
    }

    public PageResult<AttendanceException> accountantPage(ExceptionQueryDTO dto) {
        Pageable pageable = PageRequest.of(
                Math.max(dto.getPage() - 1, 0),
                dto.getSize(),
                Sort.by(Sort.Direction.DESC, "exceptionDate", "id")
        );
        Page<AttendanceException> pg = excRepo.searchPage(
                null, null, dto.getEmployeeId(), dto.getStatus(),
                dto.getExceptionType(), dto.getStartDate(), dto.getEndDate(), dto.getKeyword(), pageable
        );
        return PageResult.of(pg.getTotalElements(), dto.getPage(), dto.getSize(), pg.getContent());
    }

    public Map<String, Object> detail(Long id) {
        AttendanceException e = excRepo.findById(id)
                .orElseThrow(() -> new BizException("异常记录不存在"));
        UserContext.CurrentUser user = UserContext.getCurrent();
        if (user.getRole() == Role.RECRUITER && !e.getRecruiterId().equals(user.getUserId())) {
            throw new BizException("无权查看该异常记录");
        }
        if (user.getRole() == Role.SUPERVISOR && !e.getSupervisorId().equals(user.getUserId())) {
            throw new BizException("无权查看该异常记录");
        }
        List<RejectRecord> rejects = rejectRepo.findByExceptionIdOrderByCreatedAtDesc(id);
        List<SupplementRecord> supplements = supplementRepo.findByExceptionIdOrderByCreatedAtDesc(id);
        AttendanceSchedule schedule = scheduleRepo.findById(e.getScheduleId()).orElse(null);

        List<Attachment> attachments = attachmentRepo.findByBizTypeAndBizIdOrderByCreatedAtDesc("EXCEPTION", id);
        Map<String, Object> deadlineInfo = stateMachine.buildDeadlineInfo(e);
        Map<String, Object> timeline = stateMachine.calculateExceptionTimeline(e);

        Map<String, Object> actionPermissions = buildActionPermissions(e);

        Map<String, Object> result = new HashMap<>();
        result.put("exception", e);
        result.put("schedule", schedule);
        result.put("rejectRecords", rejects);
        result.put("supplementRecords", supplements);
        result.put("attachments", attachments);
        result.put("deadlineInfo", deadlineInfo);
        result.put("timeline", timeline);
        result.put("actionPermissions", actionPermissions);
        return result;
    }

    private Map<String, Object> buildActionPermissions(AttendanceException e) {
        UserContext.CurrentUser user = UserContext.getCurrent();
        Map<String, Object> perm = new HashMap<>();
        String role = user.getRole() != null ? user.getRole().name() : "";

        boolean isRecruiter = "RECRUITER".equals(role) && e.getRecruiterId().equals(user.getUserId());
        boolean isSupervisor = "SUPERVISOR".equals(role) && e.getSupervisorId().equals(user.getUserId());
        boolean isAccountant = "ACCOUNTANT".equals(role);

        perm.put("canReject", isSupervisor &&
                (e.getStatus() == ExceptionStatus.PENDING || e.getStatus() == ExceptionStatus.SUPPLEMENTED));
        perm.put("canConfirm", isSupervisor &&
                (e.getStatus() == ExceptionStatus.PENDING || e.getStatus() == ExceptionStatus.SUPPLEMENTED));
        perm.put("canSupplement", isRecruiter &&
                e.getStatus() == ExceptionStatus.REJECTED &&
                !e.isDeadlineExceeded());
        perm.put("canReopenSupplement", isSupervisor &&
                e.getStatus() == ExceptionStatus.REJECTED &&
                e.isDeadlineExceeded());
        perm.put("canClose", isAccountant && e.getStatus() == ExceptionStatus.CONFIRMED);
        perm.put("canViewDetail", isRecruiter || isSupervisor || isAccountant);
        return perm;
    }

    @Transactional
    public AttendanceException reject(RejectExceptionDTO dto) {
        AttendanceException e = excRepo.findById(dto.getExceptionId())
                .orElseThrow(() -> new BizException("异常记录不存在"));
        UserContext.CurrentUser user = UserContext.getCurrent();
        if (!e.getSupervisorId().equals(user.getUserId())) {
            throw new BizException("仅对应驻场主管可驳回此异常");
        }
        if (dto.getDeadlineHours() == null || dto.getDeadlineHours() < 1) {
            throw new BizException("请设置合理的补录截止时间（小时）");
        }
        if (dto.getRejectReason() == null || dto.getRejectReason().trim().isEmpty()) {
            throw new BizException("请填写驳回原因，明确招聘专员需要补录的内容");
        }

        LocalDateTime deadline = LocalDateTime.now().plusHours(dto.getDeadlineHours());
        stateMachine.transitionException(e, ExceptionStatus.REJECTED, user.getUserName());
        e.setRejectCount(e.getRejectCount() == null ? 1 : e.getRejectCount() + 1);
        e.setRejectDeadline(deadline);
        e.setLatestRejectReason(dto.getRejectReason());
        e.setLastRejectedAt(LocalDateTime.now());
        e.setLastRejectedBy(user.getUserId());
        e.setLastRejectedByName(user.getUserName());
        AttendanceException saved = excRepo.save(e);

        RejectRecord rr = new RejectRecord();
        rr.setExceptionId(e.getId());
        rr.setRejectReason(dto.getRejectReason());
        rr.setDeadline(deadline);
        rr.setRejectedBy(user.getUserId());
        rr.setRejectedByName(user.getUserName());
        rr.setAttachmentId(dto.getAttachmentId());
        rr.setSiteSnapshot(dto.getSiteSnapshot());
        rejectRepo.save(rr);
        return saved;
    }

    @Transactional
    public AttendanceException reopenSupplement(Long id, int additionalHours, String reopenRemark) {
        AttendanceException e = excRepo.findById(id)
                .orElseThrow(() -> new BizException("异常记录不存在"));
        UserContext.CurrentUser user = UserContext.getCurrent();
        if (!e.getSupervisorId().equals(user.getUserId())) {
            throw new BizException("仅对应驻场主管可重新开启补录");
        }
        if (e.getStatus() != ExceptionStatus.REJECTED) {
            throw new BizException("仅已驳回状态的异常可重新开启补录");
        }
        if (additionalHours < 1) {
            throw new BizException("延长时间至少1小时");
        }

        LocalDateTime newDeadline = LocalDateTime.now().plusHours(additionalHours);
        e.setRejectDeadline(newDeadline);
        e.setLatestRejectReason(e.getLatestRejectReason() + "（主管重新开启补录，延长" + additionalHours + "小时）");
        e.setLastRejectedAt(LocalDateTime.now());

        RejectRecord rr = new RejectRecord();
        rr.setExceptionId(e.getId());
        rr.setRejectReason("重新开启补录通道：" + (reopenRemark != null ? reopenRemark : "延长" + additionalHours + "小时"));
        rr.setDeadline(newDeadline);
        rr.setRejectedBy(user.getUserId());
        rr.setRejectedByName(user.getUserName());
        rejectRepo.save(rr);

        return excRepo.save(e);
    }

    @Transactional
    public AttendanceException confirmBySupervisor(Long id, String confirmRemark) {
        AttendanceException e = excRepo.findById(id)
                .orElseThrow(() -> new BizException("异常记录不存在"));
        UserContext.CurrentUser user = UserContext.getCurrent();
        if (!e.getSupervisorId().equals(user.getUserId())) {
            throw new BizException("仅对应驻场主管可确认此异常");
        }

        stateMachine.transitionException(e, ExceptionStatus.CONFIRMED, user.getUserName());
        e.setConfirmedAt(LocalDateTime.now());
        e.setConfirmedBy(user.getUserId());
        e.setConfirmRemark(confirmRemark);
        AttendanceException saved = excRepo.save(e);

        AttendanceSchedule s = scheduleRepo.findById(e.getScheduleId()).orElse(null);
        if (s != null && s.getStatus() == ScheduleStatus.EXCEPTION) {
            stateMachine.transitionSchedule(s, ScheduleStatus.CONFIRMED, user.getUserName());
            s.setConfirmedAt(LocalDateTime.now());
            s.setConfirmedRemark(confirmRemark != null ? confirmRemark : "异常确认后自动确认排班");
            scheduleRepo.save(s);
        }
        return saved;
    }

    @Transactional
    public AttendanceException submitSupplement(SupplementSubmitDTO dto) {
        AttendanceException e = excRepo.findById(dto.getExceptionId())
                .orElseThrow(() -> new BizException("异常记录不存在"));
        UserContext.CurrentUser user = UserContext.getCurrent();
        if (!e.getRecruiterId().equals(user.getUserId())) {
            throw new BizException("仅对应招聘专员可补录此异常");
        }
        if (e.getStatus() != ExceptionStatus.REJECTED) {
            throw new BizException("当前状态不允许补录，仅已驳回状态可补录");
        }
        if (e.isDeadlineExceeded()) {
            throw new BizException("已超过补录截止时间，请联系驻场主管重新开启补录通道");
        }
        if (dto.getSupplementContent() == null || dto.getSupplementContent().trim().isEmpty()) {
            throw new BizException("请填写补录内容说明");
        }

        stateMachine.transitionException(e, ExceptionStatus.SUPPLEMENTED, user.getUserName());
        e.setSupplementedAt(LocalDateTime.now());
        e.setSupplementedBy(user.getUserId());
        e.setSupplementRemark(dto.getSupplementContent());
        AttendanceException saved = excRepo.save(e);

        SupplementRecord sr = new SupplementRecord();
        sr.setExceptionId(e.getId());
        sr.setScheduleId(e.getScheduleId());
        sr.setSupplementContent(dto.getSupplementContent());
        sr.setCorrectedHours(dto.getCorrectedHours());
        sr.setCorrectedPunchIn(dto.getCorrectedPunchIn());
        sr.setCorrectedPunchOut(dto.getCorrectedPunchOut());
        sr.setProofAttachmentId(dto.getProofAttachmentId());
        sr.setProofRemark(dto.getProofRemark());
        sr.setSubmittedBy(user.getUserId());
        sr.setSubmittedByName(user.getUserName());
        sr.setReviewStatus("PENDING");
        supplementRepo.save(sr);
        return saved;
    }

    @Transactional
    public AttendanceException closeByAccountant(Long id) {
        AttendanceException e = excRepo.findById(id)
                .orElseThrow(() -> new BizException("异常记录不存在"));
        UserContext.CurrentUser user = UserContext.getCurrent();
        if (e.getStatus() != ExceptionStatus.CONFIRMED) {
            throw new BizException("仅已确认状态的异常可归档关闭");
        }
        stateMachine.transitionException(e, ExceptionStatus.CLOSED, user.getUserName());
        e.setClosedAt(LocalDateTime.now());
        e.setClosedBy(user.getUserId());
        return excRepo.save(e);
    }

    public Map<String, Object> recruiterDeadlineStats() {
        Long recruiterId = UserContext.getCurrent().getUserId();
        List<AttendanceException> rejected = excRepo.searchPage(
                recruiterId, null, null, ExceptionStatus.REJECTED,
                null, null, null, null,
                PageRequest.of(0, 1000, Sort.by("id"))
        ).getContent();

        long approaching = rejected.stream().filter(AttendanceException::isDeadlineApproaching).count();
        long exceeded = rejected.stream().filter(AttendanceException::isDeadlineExceeded).count();
        long normal = rejected.size() - approaching - exceeded;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRejected", rejected.size());
        stats.put("deadlineNormal", normal);
        stats.put("deadlineApproaching", approaching);
        stats.put("deadlineExceeded", exceeded);
        stats.put("pendingExceptions", excRepo.countByRecruiterIdAndStatus(recruiterId, ExceptionStatus.PENDING));
        stats.put("supplementedAwaitingReview", excRepo.countByRecruiterIdAndStatus(recruiterId, ExceptionStatus.SUPPLEMENTED));
        stats.put("confirmed", excRepo.countByRecruiterIdAndStatus(recruiterId, ExceptionStatus.CONFIRMED));
        return stats;
    }

    public Map<String, Object> supervisorReviewStats() {
        Long supervisorId = UserContext.getCurrent().getUserId();
        Map<String, Object> stats = new HashMap<>();
        stats.put("pendingReview", excRepo.countBySupervisorIdAndStatus(supervisorId, ExceptionStatus.PENDING));
        stats.put("supplementedReview", excRepo.countBySupervisorIdAndStatus(supervisorId, ExceptionStatus.SUPPLEMENTED));
        stats.put("rejectedOutstanding", excRepo.countBySupervisorIdAndStatus(supervisorId, ExceptionStatus.REJECTED));
        stats.put("confirmed", excRepo.countBySupervisorIdAndStatus(supervisorId, ExceptionStatus.CONFIRMED));

        List<AttendanceException> rejected = excRepo.searchPage(
                null, supervisorId, null, ExceptionStatus.REJECTED,
                null, null, null, null,
                PageRequest.of(0, 1000, Sort.by("id"))
        ).getContent();
        long exceeded = rejected.stream().filter(AttendanceException::isDeadlineExceeded).count();
        stats.put("exceededNeedReopen", exceeded);
        return stats;
    }

    public Map<String, Object> accountantSettlementStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("pendingConfirm", excRepo.countByStatus(ExceptionStatus.PENDING)
                + excRepo.countByStatus(ExceptionStatus.SUPPLEMENTED)
                + excRepo.countByStatus(ExceptionStatus.REJECTED));
        stats.put("confirmedReady", excRepo.countByStatus(ExceptionStatus.CONFIRMED));
        stats.put("closedSettled", excRepo.countByStatus(ExceptionStatus.CLOSED));
        return stats;
    }

    public long countDeadlineApproaching() {
        Long recruiterId = UserContext.getCurrent().getUserId();
        List<AttendanceException> list = excRepo.searchPage(
                recruiterId, null, null, ExceptionStatus.REJECTED,
                null, null, null, null,
                PageRequest.of(0, 1000, Sort.by("id"))
        ).getContent();
        return list.stream().filter(AttendanceException::isDeadlineApproaching).count();
    }

    public long countDeadlineExceeded() {
        Long recruiterId = UserContext.getCurrent().getUserId();
        List<AttendanceException> list = excRepo.searchPage(
                recruiterId, null, null, ExceptionStatus.REJECTED,
                null, null, null, null,
                PageRequest.of(0, 1000, Sort.by("id"))
        ).getContent();
        return list.stream().filter(AttendanceException::isDeadlineExceeded).count();
    }
}
