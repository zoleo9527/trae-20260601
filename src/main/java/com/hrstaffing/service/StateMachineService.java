package com.hrstaffing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrstaffing.common.auth.UserContext;
import com.hrstaffing.common.exception.BizException;
import com.hrstaffing.entity.AttendanceException;
import com.hrstaffing.entity.AttendanceSchedule;
import com.hrstaffing.entity.StatusTransitionLog;
import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ScheduleStatus;
import com.hrstaffing.repository.StatusTransitionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StateMachineService {

    public static final String BIZ_SCHEDULE = "SCHEDULE";
    public static final String BIZ_EXCEPTION = "EXCEPTION";

    private final StatusTransitionLogRepository logRepo;
    private final ObjectMapper objectMapper;

    @Transactional
    public void transitionSchedule(AttendanceSchedule schedule, ScheduleStatus target, String operator) {
        ScheduleStatus current = schedule.getStatus();
        if (current == target) {
            log.info("Schedule {} already at status {}, skip transition", schedule.getId(), target);
            return;
        }
        if (!current.canTransitionTo(target)) {
            throw new BizException("排班状态不允许变更: " + current.getLabel() + " → " + target.getLabel());
        }
        log.info("Schedule {} status transition: {} → {} by {}", schedule.getId(), current, target, operator);

        String snapshotBefore = toJson(buildScheduleSnapshot(schedule));
        schedule.setStatus(target);
        String snapshotAfter = toJson(buildScheduleSnapshot(schedule));

        saveLog(BIZ_SCHEDULE, schedule.getId(),
                current != null ? current.name() : null,
                target.name(),
                "排班状态变更", snapshotBefore, snapshotAfter);
    }

    @Transactional
    public void transitionException(AttendanceException exc, ExceptionStatus target, String operator) {
        ExceptionStatus current = exc.getStatus();
        if (current == target) {
            log.info("Exception {} already at status {}, skip transition", exc.getId(), target);
            return;
        }
        if (!current.canTransitionTo(target)) {
            throw new BizException("异常状态不允许变更: " + current.getLabel() + " → " + target.getLabel());
        }
        log.info("Exception {} status transition: {} → {} by {}", exc.getId(), current, target, operator);

        String snapshotBefore = toJson(buildExceptionSnapshot(exc));
        exc.setStatus(target);
        String snapshotAfter = toJson(buildExceptionSnapshot(exc));

        saveLog(BIZ_EXCEPTION, exc.getId(),
                current != null ? current.name() : null,
                target.name(),
                buildTransitionReason(current, target),
                snapshotBefore, snapshotAfter);
    }

    private String buildTransitionReason(ExceptionStatus from, ExceptionStatus to) {
        return switch (to) {
            case REJECTED -> "驻场主管驳回，需招聘专员补录";
            case SUPPLEMENTED -> "招聘专员提交补录，等待主管复审";
            case CONFIRMED -> from == ExceptionStatus.SUPPLEMENTED
                    ? "主管复审通过，异常确认完毕"
                    : "主管确认异常处理完毕";
            case CLOSED -> "会计薪酬核算完成，异常归档关闭";
            default -> "状态变更: " + (from != null ? from.getLabel() : "null") + " → " + to.getLabel();
        };
    }

    public Map<String, Object> buildDeadlineInfo(AttendanceException exc) {
        Map<String, Object> info = new HashMap<>();
        if (exc.getStatus() != ExceptionStatus.REJECTED || exc.getRejectDeadline() == null) {
            info.put("active", false);
            info.put("hint", "");
            info.put("canSupplement", false);
            return info;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = exc.getRejectDeadline();
        Duration duration = Duration.between(now, deadline);
        long totalHours = duration.toHours();
        long totalMinutes = duration.toMinutes() % 60;

        boolean exceeded = exc.isDeadlineExceeded();
        boolean approaching = exc.isDeadlineApproaching();
        String level = exceeded ? "EXCEEDED" : (approaching ? "WARNING" : "NORMAL");

        info.put("active", true);
        info.put("level", level);
        info.put("deadline", deadline);
        info.put("hoursRemaining", totalHours);
        info.put("minutesRemaining", totalMinutes);
        info.put("isExceeded", exceeded);
        info.put("isApproaching", approaching);
        info.put("canSupplement", !exceeded);
        info.put("rejectCount", exc.getRejectCount());
        info.put("latestRejectReason", exc.getLatestRejectReason());
        info.put("lastRejectedByName", exc.getLastRejectedByName());
        info.put("lastRejectedAt", exc.getLastRejectedAt());

        if (exceeded) {
            info.put("hint", "已超过补录截止时间，需联系主管重新开启补录通道");
        } else if (approaching) {
            if (totalHours < 1) {
                info.put("hint", "紧急：距离补录截止仅剩 " + totalMinutes + " 分钟，请立即处理！");
            } else {
                info.put("hint", "距离补录截止还剩 " + totalHours + " 小时 " + totalMinutes + " 分钟，请尽快处理");
            }
        } else {
            info.put("hint", "请在 " + totalHours + " 小时内完成补录并提交复审");
        }
        return info;
    }

    public List<StatusTransitionLog> getTransitionTrail(String bizType, Long bizId) {
        return logRepo.findByBizTypeAndBizIdOrderByCreatedAtAsc(bizType, bizId);
    }

    public Map<String, Object> calculateExceptionTimeline(AttendanceException exc) {
        Map<String, Object> timeline = new HashMap<>();
        if (exc.getCreatedAt() == null) {
            timeline.put("totalHours", 0);
            return timeline;
        }

        LocalDateTime end = exc.getClosedAt() != null ? exc.getClosedAt()
                : (exc.getConfirmedAt() != null ? exc.getConfirmedAt() : LocalDateTime.now());

        long totalMinutes = Duration.between(exc.getCreatedAt(), end).toMinutes();
        double totalHours = totalMinutes / 60.0;

        long rejectMinutes = 0;
        if (exc.getStatus() == ExceptionStatus.REJECTED && exc.getLastRejectedAt() != null) {
            rejectMinutes = Duration.between(exc.getLastRejectedAt(), LocalDateTime.now()).toMinutes();
        }

        timeline.put("createdAt", exc.getCreatedAt());
        timeline.put("endedAt", end);
        timeline.put("totalMinutes", totalMinutes);
        timeline.put("totalHours", String.format("%.1f", totalHours));
        timeline.put("currentStageMinutes", rejectMinutes);
        timeline.put("currentStageHours", String.format("%.1f", rejectMinutes / 60.0));
        timeline.put("isClosed", exc.getStatus() == ExceptionStatus.CLOSED);
        timeline.put("trail", getTransitionTrail(BIZ_EXCEPTION, exc.getId()));
        return timeline;
    }

    private Map<String, Object> buildScheduleSnapshot(AttendanceSchedule s) {
        Map<String, Object> snap = new HashMap<>();
        snap.put("id", s.getId());
        snap.put("status", s.getStatus() != null ? s.getStatus().name() : null);
        snap.put("employeeName", s.getEmployeeName());
        snap.put("scheduleDate", s.getScheduleDate() != null ? s.getScheduleDate().toString() : null);
        snap.put("scheduledHours", s.getScheduledHours());
        snap.put("actualWorkHours", s.getActualWorkHours());
        return snap;
    }

    private Map<String, Object> buildExceptionSnapshot(AttendanceException e) {
        Map<String, Object> snap = new HashMap<>();
        snap.put("id", e.getId());
        snap.put("status", e.getStatus() != null ? e.getStatus().name() : null);
        snap.put("employeeName", e.getEmployeeName());
        snap.put("exceptionType", e.getExceptionType() != null ? e.getExceptionType().name() : null);
        snap.put("affectedHours", e.getAffectedHours());
        snap.put("rejectCount", e.getRejectCount());
        if (e.getRejectDeadline() != null) {
            snap.put("rejectDeadline", e.getRejectDeadline().toString());
        }
        return snap;
    }

    private void saveLog(String bizType, Long bizId, String fromStatus, String toStatus,
                         String reason, String snapshotBefore, String snapshotAfter) {
        UserContext.CurrentUser user = UserContext.getCurrent();
        StatusTransitionLog log = new StatusTransitionLog();
        log.setBizType(bizType);
        log.setBizId(bizId);
        log.setFromStatus(fromStatus);
        log.setToStatus(toStatus);
        log.setTransitionReason(reason);
        log.setOperatorId(user.getUserId());
        log.setOperatorName(user.getUserName());
        log.setOperatorRole(user.getRole() != null ? user.getRole().name() : null);
        log.setSnapshotBefore(snapshotBefore);
        log.setSnapshotAfter(snapshotAfter);
        logRepo.save(log);
    }

    private String toJson(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
