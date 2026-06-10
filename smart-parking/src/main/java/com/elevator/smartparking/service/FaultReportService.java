package com.elevator.smartparking.service;

import com.elevator.smartparking.dto.FaultReportCreateDTO;
import com.elevator.smartparking.dto.FaultReportDetailVO;
import com.elevator.smartparking.dto.FaultReportHandleDTO;
import com.elevator.smartparking.dto.RescueSimpleVO;
import com.elevator.smartparking.dto.TimelineEventVO;
import com.elevator.smartparking.entity.*;
import com.elevator.smartparking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FaultReportService {

    private final FaultReportRepository faultReportRepository;
    private final ElevatorRepository elevatorRepository;
    private final SysUserRepository sysUserRepository;
    private final HandleRecordService handleRecordService;
    private final EntrapmentRescueRepository entrapmentRescueRepository;
    private final StatusConstraintService statusConstraintService;

    public String getStatusText(FaultStatus status) {
        return switch (status) {
            case PENDING -> "待受理";
            case PROCESSING -> "处理中";
            case TRANSFERRED_TO_RESCUE -> "已转困人处置";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
        };
    }

    @Transactional
    public FaultReport createReport(FaultReportCreateDTO dto, Long operatorId, String operatorName) {
        Elevator elevator = elevatorRepository.findById(dto.getElevatorId())
                .orElseThrow(() -> new IllegalArgumentException("电梯不存在"));

        FaultReport report = new FaultReport();
        report.setReportNo(generateReportNo());
        report.setElevatorId(dto.getElevatorId());
        report.setFaultType(dto.getFaultType());
        report.setFaultDescription(dto.getFaultDescription());
        report.setReporterName(dto.getReporterName());
        report.setReporterPhone(dto.getReporterPhone());
        report.setReportSource(dto.getReportSource());
        report.setStatus(FaultStatus.PENDING);
        report.setHasEntrapment(dto.getHasEntrapment() != null ? dto.getHasEntrapment() : false);
        report.setEntrapmentCount(dto.getEntrapmentCount() != null ? dto.getEntrapmentCount() : 0);
        report.setRemark(dto.getRemark());
        report.setExportStatus(ExportStatus.NOT_EXPORTED);
        report.setAttachmentCount(0);
        report.setNotificationStatus(NotificationStatus.NOT_NOTIFIED);

        report = faultReportRepository.save(report);

        handleRecordService.addRecord(
                RecordType.FAULT_REPORT,
                report.getId(),
                "创建故障报修",
                null,
                FaultStatus.PENDING.name(),
                buildCreateContent(dto),
                operatorId,
                operatorName
        );

        return report;
    }

    @Transactional
    public FaultReport acceptReport(Long id, Long handlerId) {
        FaultReport report = faultReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));

        FaultStatus oldStatus = report.getStatus();
        if (!statusConstraintService.canTransitionFault(oldStatus, FaultStatus.PROCESSING)) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getFaultStatusText(oldStatus) + "] 不允许受理,合法流转仅: " + statusConstraintService.getFaultNextStates(oldStatus));
        }

        SysUser handler = sysUserRepository.findById(handlerId)
                .orElseThrow(() -> new IllegalArgumentException("处理人不存在"));

        report.setStatus(FaultStatus.PROCESSING);
        report.setHandlerId(handlerId);
        report.setAcceptTime(LocalDateTime.now());
        report = faultReportRepository.save(report);

        handleRecordService.addRecord(
                RecordType.FAULT_REPORT,
                report.getId(),
                "受理",
                oldStatus.name(),
                FaultStatus.PROCESSING.name(),
                "受理故障报修，处理人：" + handler.getName(),
                handlerId,
                handler.getName()
        );

        return report;
    }

    @Transactional
    public FaultReport processReport(Long id, FaultReportHandleDTO dto) {
        FaultReport report = faultReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));

        if (report.getStatus() != FaultStatus.PROCESSING) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getFaultStatusText(report.getStatus()) + "] 不允许处理,仅 PROCESSING 状态下可更新处理进度");
        }

        String operatorName = "系统";
        if (dto.getHandlerId() != null) {
            operatorName = sysUserRepository.findById(dto.getHandlerId())
                    .map(SysUser::getName)
                    .orElse("未知用户");
        }

        if (dto.getRemark() != null) {
            report.setRemark(dto.getRemark());
        }
        if (dto.getSolution() != null) {
            report.setSolution(dto.getSolution());
        }

        report = faultReportRepository.save(report);

        handleRecordService.addRecord(
                RecordType.FAULT_REPORT,
                report.getId(),
                "处理中",
                FaultStatus.PROCESSING.name(),
                FaultStatus.PROCESSING.name(),
                dto.getContent(),
                dto.getHandlerId(),
                operatorName
        );

        return report;
    }

    @Transactional
    public FaultReport completeReport(Long id, FaultReportHandleDTO dto) {
        FaultReport report = faultReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));

        FaultStatus oldStatus = report.getStatus();
        if (!statusConstraintService.canTransitionFault(oldStatus, FaultStatus.COMPLETED)) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getFaultStatusText(oldStatus) + "] 不允许完成,合法流转仅: " + statusConstraintService.getFaultNextStates(oldStatus));
        }

        String operatorName = "系统";
        if (dto.getHandlerId() != null) {
            operatorName = sysUserRepository.findById(dto.getHandlerId())
                    .map(SysUser::getName)
                    .orElse("未知用户");
        }

        report.setStatus(FaultStatus.COMPLETED);
        report.setCompleteTime(LocalDateTime.now());
        if (dto.getSolution() != null) {
            report.setSolution(dto.getSolution());
        }
        if (dto.getRemark() != null) {
            report.setRemark(dto.getRemark());
        }
        report = faultReportRepository.save(report);

        handleRecordService.addRecord(
                RecordType.FAULT_REPORT,
                report.getId(),
                "完成",
                oldStatus.name(),
                FaultStatus.COMPLETED.name(),
                dto.getContent() != null ? dto.getContent() : "故障报修处理完成",
                dto.getHandlerId(),
                operatorName
        );

        return report;
    }

    @Transactional
    public FaultReport cancelReport(Long id, String reason, Long operatorId) {
        FaultReport report = faultReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));

        FaultStatus oldStatus = report.getStatus();
        if (!statusConstraintService.canTransitionFault(oldStatus, FaultStatus.CANCELLED)) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getFaultStatusText(oldStatus) + "] 不允许取消,合法流转仅: " + statusConstraintService.getFaultNextStates(oldStatus));
        }

        String operatorName = sysUserRepository.findById(operatorId)
                .map(SysUser::getName)
                .orElse("未知用户");

        report.setStatus(FaultStatus.CANCELLED);
        report.setCompleteTime(LocalDateTime.now());
        report = faultReportRepository.save(report);

        handleRecordService.addRecord(
                RecordType.FAULT_REPORT,
                report.getId(),
                "取消",
                oldStatus.name(),
                FaultStatus.CANCELLED.name(),
                "取消原因：" + reason,
                operatorId,
                operatorName
        );

        return report;
    }

    @Transactional
    public Long transferToRescue(Long id, Long operatorId) {
        FaultReport report = faultReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));

        FaultStatus oldStatus = report.getStatus();
        if (!statusConstraintService.canTransitionFault(oldStatus, FaultStatus.TRANSFERRED_TO_RESCUE)) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getFaultStatusText(oldStatus) + "] 不允许转困人处置,合法流转仅: " + statusConstraintService.getFaultNextStates(oldStatus));
        }

        if (report.getTransferRescueId() != null) {
            throw new IllegalStateException("已存在关联的困人处置工单,无需重复转单(transferRescueId=" + report.getTransferRescueId() + ")");
        }

        String operatorName = sysUserRepository.findById(operatorId)
                .map(SysUser::getName)
                .orElse("未知用户");

        EntrapmentRescue rescue = new EntrapmentRescue();
        rescue.setRescueNo(generateRescueNo());
        rescue.setElevatorId(report.getElevatorId());
        rescue.setFaultReportId(report.getId());
        rescue.setTrappedCount(report.getEntrapmentCount() != null ? report.getEntrapmentCount() : 1);
        rescue.setReporterName(report.getReporterName());
        rescue.setReporterPhone(report.getReporterPhone());
        rescue.setStatus(RescueStatus.PENDING_RESCUE);
        rescue.setReportTime(LocalDateTime.now());
        rescue.setInitialRemark(report.getRemark());
        rescue.setRemark("由故障报修转入，原报修单号：" + report.getReportNo());
        rescue.setExportStatus(ExportStatus.NOT_EXPORTED);
        rescue.setAttachmentCount(0);
        rescue.setNotificationStatus(NotificationStatus.NOT_NOTIFIED);

        rescue = entrapmentRescueRepository.save(rescue);

        FaultStatus oldStatus = report.getStatus();
        report.setStatus(FaultStatus.TRANSFERRED_TO_RESCUE);
        report.setTransferRescueId(rescue.getId());
        report = faultReportRepository.save(report);

        handleRecordService.addRecord(
                RecordType.FAULT_REPORT,
                report.getId(),
                "转困人处置",
                oldStatus.name(),
                FaultStatus.TRANSFERRED_TO_RESCUE.name(),
                "转困人处置，困人单号：" + rescue.getRescueNo(),
                operatorId,
                operatorName
        );

        handleRecordService.addRecord(
                RecordType.ENTRAPMENT_RESCUE,
                rescue.getId(),
                "创建",
                null,
                RescueStatus.PENDING_RESCUE.name(),
                "由故障报修转入，原报修单号：" + report.getReportNo() + "。初始备注：" + report.getRemark(),
                operatorId,
                operatorName
        );

        return rescue.getId();
    }

    public FaultReportDetailVO getDetail(Long id) {
        FaultReport report = faultReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));

        FaultReportDetailVO vo = new FaultReportDetailVO();
        vo.setId(report.getId());
        vo.setReportNo(report.getReportNo());
        vo.setElevatorId(report.getElevatorId());
        vo.setFaultType(report.getFaultType());
        vo.setFaultDescription(report.getFaultDescription());
        vo.setReporterName(report.getReporterName());
        vo.setReporterPhone(report.getReporterPhone());
        vo.setReportSource(report.getReportSource());
        vo.setStatus(report.getStatus().name());
        vo.setStatusText(getStatusText(report.getStatus()));
        vo.setHandlerId(report.getHandlerId());
        vo.setAcceptTime(report.getAcceptTime());
        vo.setCompleteTime(report.getCompleteTime());
        vo.setSolution(report.getSolution());
        vo.setHasEntrapment(report.getHasEntrapment());
        vo.setEntrapmentCount(report.getEntrapmentCount());
        vo.setTransferRescueId(report.getTransferRescueId());
        vo.setRemark(report.getRemark());
        if (report.getExportStatus() != null) {
            vo.setExportStatus(report.getExportStatus().name());
            vo.setExportStatusText(getExportStatusText(report.getExportStatus()));
        }
        vo.setAttachmentCount(report.getAttachmentCount());
        if (report.getNotificationStatus() != null) {
            vo.setNotificationStatus(report.getNotificationStatus().name());
            vo.setNotificationStatusText(getNotificationStatusText(report.getNotificationStatus()));
        }
        vo.setCreateTime(report.getCreateTime());
        vo.setUpdateTime(report.getUpdateTime());

        elevatorRepository.findById(report.getElevatorId())
                .ifPresent(e -> vo.setElevatorNo(e.getElevatorNo()));

        if (report.getHandlerId() != null) {
            sysUserRepository.findById(report.getHandlerId())
                    .ifPresent(u -> vo.setHandlerName(u.getName()));
        }

        if (report.getTransferRescueId() != null) {
            entrapmentRescueRepository.findById(report.getTransferRescueId())
                    .ifPresent(r -> {
                        vo.setTransferRescueNo(r.getRescueNo());
                        vo.setRescueInitialRemark(r.getInitialRemark());
                        vo.setRescueLatestProgress(r.getRescueProcess());
                    });
        }

        List<HandleRecord> faultRecords = handleRecordService.getRecords(RecordType.FAULT_REPORT, id);
        vo.setRecords(faultRecords);

        for (HandleRecord rec : faultRecords) {
            if ("转困人处置".equals(rec.getAction())) {
                vo.setTransferRemark(rec.getContent());
                vo.setTransferOperatorName(rec.getOperatorName());
                vo.setTransferTime(rec.getOperateTime());
                break;
            }
        }

        List<EntrapmentRescue> relatedRescues = entrapmentRescueRepository.findByFaultReportIdOrderByCreateTimeDesc(id);
        List<RescueSimpleVO> rescueVOs = new ArrayList<>();
        List<HandleRecord> allRescueRecords = new ArrayList<>();
        for (EntrapmentRescue r : relatedRescues) {
            RescueSimpleVO rvo = new RescueSimpleVO();
            rvo.setId(r.getId());
            rvo.setRescueNo(r.getRescueNo());
            rvo.setStatus(r.getStatus().name());
            rvo.setStatusText(getRescueStatusText(r.getStatus()));
            rvo.setTrappedCount(r.getTrappedCount());
            rvo.setInitialRemark(r.getInitialRemark());
            rvo.setRescueProcess(r.getRescueProcess());
            rvo.setSolution(r.getSolution());
            rvo.setCreateTime(r.getCreateTime());
            rvo.setRescuedTime(r.getRescuedTime());
            rescueVOs.add(rvo);
            allRescueRecords.addAll(handleRecordService.getRecords(RecordType.ENTRAPMENT_RESCUE, r.getId()));
        }
        vo.setRelatedRescues(rescueVOs);
        vo.setRescueRecords(allRescueRecords);

        vo.setTimeline(buildFaultTimeline(report, vo));
        vo.setRemarkChain(buildFaultRemarkChain(report, vo, relatedRescues));

        return vo;
    }

    private List<TimelineEventVO> buildFaultTimeline(FaultReport report, FaultReportDetailVO detail) {
        List<TimelineEventVO> timeline = new ArrayList<>();

        for (HandleRecord fr : detail.getRecords()) {
            TimelineEventVO ev = new TimelineEventVO();
            ev.setEventType("FAULT_HANDLE");
            ev.setEventTypeText("[故障报修] " + fr.getAction());
            ev.setSource("FAULT_REPORT");
            ev.setEventTime(fr.getOperateTime());
            ev.setFromStatus(fr.getFromStatus());
            ev.setFromStatusText(fr.getFromStatus() != null ? safeFaultText(fr.getFromStatus()) : null);
            ev.setToStatus(fr.getToStatus());
            ev.setToStatusText(fr.getToStatus() != null ? safeFaultText(fr.getToStatus()) : null);
            ev.setTitle(fr.getAction());
            ev.setContent(fr.getContent());
            ev.setOperatorId(fr.getOperatorId());
            ev.setOperatorName(fr.getOperatorName());
            ev.setRelatedRecordId(report.getId());
            ev.setRelatedRecordNo(report.getReportNo());
            timeline.add(ev);
        }

        if (detail.getRescueRecords() != null) {
            for (HandleRecord rr : detail.getRescueRecords()) {
                TimelineEventVO ev = new TimelineEventVO();
                ev.setEventType("RESCUE_HANDLE");
                ev.setEventTypeText("[关联困人处置] " + rr.getAction());
                ev.setSource("ENTRAPMENT_RESCUE");
                ev.setEventTime(rr.getOperateTime());
                ev.setFromStatus(rr.getFromStatus());
                ev.setFromStatusText(rr.getFromStatus() != null ? safeRescueText(rr.getFromStatus()) : null);
                ev.setToStatus(rr.getToStatus());
                ev.setToStatusText(rr.getToStatus() != null ? safeRescueText(rr.getToStatus()) : null);
                ev.setTitle(rr.getAction());
                ev.setContent(rr.getContent());
                ev.setOperatorId(rr.getOperatorId());
                ev.setOperatorName(rr.getOperatorName());
                ev.setRelatedRecordId(rr.getRecordId());
                entrapmentRescueRepository.findById(rr.getRecordId())
                        .ifPresent(r -> ev.setRelatedRecordNo(r.getRescueNo()));
                timeline.add(ev);
            }
        }

        timeline.sort(Comparator.comparing(TimelineEventVO::getEventTime, Comparator.nullsLast(Comparator.naturalOrder())));
        return timeline;
    }

    private List<Map<String, Object>> buildFaultRemarkChain(FaultReport report, FaultReportDetailVO detail, List<EntrapmentRescue> relatedRescues) {
        List<Map<String, Object>> chain = new ArrayList<>();

        for (HandleRecord fr : detail.getRecords()) {
            if (fr.getContent() == null || fr.getContent().isEmpty()) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("seq", chain.size());
            m.put("source", "FAULT_RECORD");
            m.put("sourceText", "故障报修记录-" + fr.getAction());
            m.put("recordNo", report.getReportNo());
            m.put("content", fr.getContent());
            m.put("operatorName", fr.getOperatorName());
            m.put("time", fr.getOperateTime());
            m.put("fromStatus", fr.getFromStatus());
            m.put("toStatus", fr.getToStatus());
            chain.add(m);
        }

        if (report.getRemark() != null && !report.getRemark().isEmpty()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("seq", chain.size());
            m.put("source", "FAULT_LATEST_REMARK");
            m.put("sourceText", "故障报修-最新备注");
            m.put("recordNo", report.getReportNo());
            m.put("content", report.getRemark());
            m.put("capturedAt", report.getUpdateTime());
            chain.add(m);
        }

        if (relatedRescues != null && !relatedRescues.isEmpty()) {
            for (EntrapmentRescue r : relatedRescues) {
                if (r.getInitialRemark() != null && !r.getInitialRemark().isEmpty()) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("seq", chain.size());
                    m.put("source", "INITIAL_REMARK_SNAPSHOT");
                    m.put("sourceText", "转单时备注快照(困人处置 initialRemark)");
                    m.put("recordNo", r.getRescueNo());
                    m.put("content", r.getInitialRemark());
                    m.put("capturedAt", r.getCreateTime());
                    m.put("autoInherited", true);
                    m.put("note", "转困人处置时从故障报修 remark 快照复制");
                    chain.add(m);
                }
            }

            if (detail.getRescueRecords() != null) {
                for (HandleRecord rr : detail.getRescueRecords()) {
                    if (rr.getContent() == null || rr.getContent().isEmpty()) continue;
                    if ("创建".equals(rr.getAction()) || "创建困人处置".equals(rr.getAction())) continue;
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("seq", chain.size());
                    m.put("source", "RESCUE_RECORD");
                    m.put("sourceText", "困人处置记录-" + rr.getAction());
                    String rescueNo = relatedRescues.stream()
                            .filter(r -> r.getId().equals(rr.getRecordId()))
                            .map(EntrapmentRescue::getRescueNo)
                            .findFirst().orElse(null);
                    m.put("recordNo", rescueNo);
                    m.put("content", rr.getContent());
                    m.put("operatorName", rr.getOperatorName());
                    m.put("time", rr.getOperateTime());
                    chain.add(m);
                }
            }
        }
        return chain;
    }

    private String safeFaultText(String code) {
        try { return statusConstraintService.getFaultStatusText(FaultStatus.valueOf(code)); }
        catch (Exception e) { return code; }
    }

    private String safeRescueText(String code) {
        try { return statusConstraintService.getRescueStatusText(RescueStatus.valueOf(code)); }
        catch (Exception e) { return code; }
    }

    private String getRescueStatusText(RescueStatus status) {
        return switch (status) {
            case PENDING_RESCUE -> "待救援";
            case RESCUING -> "救援中";
            case RESCUED -> "已解救";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
        };
    }

    private String getExportStatusText(ExportStatus status) {
        return switch (status) {
            case NOT_EXPORTED -> "未导出";
            case EXPORTING -> "导出中";
            case EXPORTED -> "已导出";
            case FAILED -> "导出失败";
        };
    }

    private String getNotificationStatusText(NotificationStatus status) {
        return switch (status) {
            case NOT_NOTIFIED -> "未通知";
            case NOTIFIED -> "已通知";
            case FAILED -> "通知失败";
        };
    }

    public List<FaultReport> listByElevator(Long elevatorId) {
        return faultReportRepository.findByElevatorIdOrderByCreateTimeDesc(elevatorId);
    }

    public List<FaultReport> listByStatus(FaultStatus status) {
        return faultReportRepository.findByStatusOrderByCreateTimeDesc(status);
    }

    public List<FaultReport> listAll() {
        return faultReportRepository.findAll();
    }

    private String generateReportNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "FR" + date + uuid;
    }

    private String generateRescueNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "ER" + date + uuid;
    }

    private String buildCreateContent(FaultReportCreateDTO dto) {
        StringBuilder sb = new StringBuilder();
        sb.append("创建故障报修");
        if (dto.getFaultType() != null) {
            sb.append("，故障类型：").append(dto.getFaultType());
        }
        if (dto.getFaultDescription() != null) {
            sb.append("，故障描述：").append(dto.getFaultDescription());
        }
        if (dto.getHasEntrapment() != null && dto.getHasEntrapment()) {
            sb.append("，有人员被困");
            if (dto.getEntrapmentCount() != null) {
                sb.append("，被困人数：").append(dto.getEntrapmentCount());
            }
        }
        if (dto.getRemark() != null) {
            sb.append("，备注：").append(dto.getRemark());
        }
        return sb.toString();
    }
}
