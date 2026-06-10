package com.elevator.smartparking.service;

import com.elevator.smartparking.dto.RescueCreateDTO;
import com.elevator.smartparking.dto.RescueDetailVO;
import com.elevator.smartparking.dto.RescueHandleDTO;
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
public class EntrapmentRescueService {

    private final EntrapmentRescueRepository entrapmentRescueRepository;
    private final ElevatorRepository elevatorRepository;
    private final SysUserRepository sysUserRepository;
    private final FaultReportRepository faultReportRepository;
    private final HandleRecordService handleRecordService;
    private final StatusConstraintService statusConstraintService;

    public String getStatusText(RescueStatus status) {
        return switch (status) {
            case PENDING_RESCUE -> "待救援";
            case RESCUING -> "救援中";
            case RESCUED -> "已解救";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
        };
    }

    @Transactional
    public EntrapmentRescue createRescue(RescueCreateDTO dto, Long operatorId, String operatorName) {
        Elevator elevator = elevatorRepository.findById(dto.getElevatorId())
                .orElseThrow(() -> new IllegalArgumentException("电梯不存在"));

        if (dto.getFaultReportId() != null) {
            faultReportRepository.findById(dto.getFaultReportId())
                    .orElseThrow(() -> new IllegalArgumentException("关联的故障报修不存在"));
        }

        EntrapmentRescue rescue = new EntrapmentRescue();
        rescue.setRescueNo(generateRescueNo());
        rescue.setElevatorId(dto.getElevatorId());
        rescue.setFaultReportId(dto.getFaultReportId());
        rescue.setTrappedCount(dto.getTrappedCount());
        rescue.setTrappedFloor(dto.getTrappedFloor());
        rescue.setReporterName(dto.getReporterName());
        rescue.setReporterPhone(dto.getReporterPhone());
        rescue.setStatus(RescueStatus.PENDING_RESCUE);
        rescue.setReportTime(LocalDateTime.now());
        rescue.setRescuerId(dto.getRescuerId());
        rescue.setInitialRemark(dto.getInitialRemark());
        rescue.setRemark(dto.getInitialRemark());
        rescue.setExportStatus(ExportStatus.NOT_EXPORTED);
        rescue.setAttachmentCount(0);
        rescue.setNotificationStatus(NotificationStatus.NOT_NOTIFIED);

        rescue = entrapmentRescueRepository.save(rescue);

        handleRecordService.addRecord(
                RecordType.ENTRAPMENT_RESCUE,
                rescue.getId(),
                "创建困人处置",
                null,
                RescueStatus.PENDING_RESCUE.name(),
                buildCreateContent(dto),
                operatorId,
                operatorName
        );

        return rescue;
    }

    @Transactional
    public EntrapmentRescue startRescue(Long id, Long rescuerId) {
        EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));

        RescueStatus oldStatus = rescue.getStatus();
        if (!statusConstraintService.canTransitionRescue(oldStatus, RescueStatus.RESCUING)) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getRescueStatusText(oldStatus) + "] 不允许开始救援,合法流转仅: " + statusConstraintService.getRescueNextStates(oldStatus));
        }

        SysUser rescuer = sysUserRepository.findById(rescuerId)
                .orElseThrow(() -> new IllegalArgumentException("救援人员不存在"));

        rescue.setStatus(RescueStatus.RESCUING);
        rescue.setRescuerId(rescuerId);
        rescue.setArrivalTime(LocalDateTime.now());
        rescue = entrapmentRescueRepository.save(rescue);

        handleRecordService.addRecord(
                RecordType.ENTRAPMENT_RESCUE,
                rescue.getId(),
                "到场救援",
                oldStatus.name(),
                RescueStatus.RESCUING.name(),
                "救援人员到场，开始救援：" + rescuer.getName(),
                rescuerId,
                rescuer.getName()
        );

        return rescue;
    }

    @Transactional
    public EntrapmentRescue updateProgress(Long id, RescueHandleDTO dto) {
        EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));

        if (rescue.getStatus() != RescueStatus.RESCUING && rescue.getStatus() != RescueStatus.RESCUED) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getRescueStatusText(rescue.getStatus()) + "] 不允许更新进度,仅 RESCUING/RESCUED 状态可更新");
        }

        String operatorName = "系统";
        if (dto.getOperatorId() != null) {
            operatorName = sysUserRepository.findById(dto.getOperatorId())
                    .map(SysUser::getName)
                    .orElse("未知用户");
        }

        if (dto.getRescueProcess() != null) {
            rescue.setRescueProcess(dto.getRescueProcess());
        }
        if (dto.getRemark() != null) {
            rescue.setRemark(dto.getRemark());
        }

        rescue = entrapmentRescueRepository.save(rescue);

        handleRecordService.addRecord(
                RecordType.ENTRAPMENT_RESCUE,
                rescue.getId(),
                "救援中",
                rescue.getStatus().name(),
                rescue.getStatus().name(),
                dto.getContent() != null ? dto.getContent() : "更新救援进度",
                dto.getOperatorId(),
                operatorName
        );

        return rescue;
    }

    @Transactional
    public EntrapmentRescue rescueSuccess(Long id, RescueHandleDTO dto) {
        EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));

        RescueStatus oldStatus = rescue.getStatus();
        if (!statusConstraintService.canTransitionRescue(oldStatus, RescueStatus.RESCUED)) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getRescueStatusText(oldStatus) + "] 不允许标记解救成功,合法流转仅: " + statusConstraintService.getRescueNextStates(oldStatus));
        }

        String operatorName = "系统";
        if (dto.getOperatorId() != null) {
            operatorName = sysUserRepository.findById(dto.getOperatorId())
                    .map(SysUser::getName)
                    .orElse("未知用户");
        }

        rescue.setStatus(RescueStatus.RESCUED);
        rescue.setRescuedTime(LocalDateTime.now());
        if (dto.getRescueProcess() != null) {
            rescue.setRescueProcess(dto.getRescueProcess());
        }
        if (dto.getHasInjury() != null) {
            rescue.setHasInjury(dto.getHasInjury());
        }
        if (dto.getInjuryDescription() != null) {
            rescue.setInjuryDescription(dto.getInjuryDescription());
        }
        rescue = entrapmentRescueRepository.save(rescue);

        handleRecordService.addRecord(
                RecordType.ENTRAPMENT_RESCUE,
                rescue.getId(),
                "人员已解救",
                oldStatus.name(),
                RescueStatus.RESCUED.name(),
                dto.getContent() != null ? dto.getContent() : "被困人员已成功解救",
                dto.getOperatorId(),
                operatorName
        );

        return rescue;
    }

    @Transactional
    public EntrapmentRescue completeRescue(Long id, RescueHandleDTO dto) {
        EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));

        RescueStatus oldStatus = rescue.getStatus();
        if (!statusConstraintService.canTransitionRescue(oldStatus, RescueStatus.COMPLETED)) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getRescueStatusText(oldStatus) + "] 不允许完成处置,合法流转仅: " + statusConstraintService.getRescueNextStates(oldStatus));
        }

        String operatorName = "系统";
        if (dto.getOperatorId() != null) {
            operatorName = sysUserRepository.findById(dto.getOperatorId())
                    .map(SysUser::getName)
                    .orElse("未知用户");
        }

        rescue.setStatus(RescueStatus.COMPLETED);
        rescue.setCompleteTime(LocalDateTime.now());
        if (dto.getEntrapmentReason() != null) {
            rescue.setEntrapmentReason(dto.getEntrapmentReason());
        }
        if (dto.getSolution() != null) {
            rescue.setSolution(dto.getSolution());
        }
        if (dto.getRemark() != null) {
            rescue.setRemark(dto.getRemark());
        }
        rescue = entrapmentRescueRepository.save(rescue);

        handleRecordService.addRecord(
                RecordType.ENTRAPMENT_RESCUE,
                rescue.getId(),
                "处置完成",
                oldStatus.name(),
                RescueStatus.COMPLETED.name(),
                dto.getContent() != null ? dto.getContent() : "困人处置完成",
                dto.getOperatorId(),
                operatorName
        );

        return rescue;
    }

    @Transactional
    public EntrapmentRescue cancelRescue(Long id, String reason, Long operatorId) {
        EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));

        RescueStatus oldStatus = rescue.getStatus();
        if (!statusConstraintService.canTransitionRescue(oldStatus, RescueStatus.CANCELLED)) {
            throw new IllegalStateException("当前状态 [" + statusConstraintService.getRescueStatusText(oldStatus) + "] 不允许取消,合法流转仅: " + statusConstraintService.getRescueNextStates(oldStatus));
        }

        String operatorName = sysUserRepository.findById(operatorId)
                .map(SysUser::getName)
                .orElse("未知用户");

        rescue.setStatus(RescueStatus.CANCELLED);
        rescue.setCompleteTime(LocalDateTime.now());
        rescue = entrapmentRescueRepository.save(rescue);

        handleRecordService.addRecord(
                RecordType.ENTRAPMENT_RESCUE,
                rescue.getId(),
                "取消",
                oldStatus.name(),
                RescueStatus.CANCELLED.name(),
                "取消原因：" + reason,
                operatorId,
                operatorName
        );

        return rescue;
    }

    public RescueDetailVO getDetail(Long id) {
        EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));

        RescueDetailVO vo = new RescueDetailVO();
        vo.setId(rescue.getId());
        vo.setRescueNo(rescue.getRescueNo());
        vo.setElevatorId(rescue.getElevatorId());
        vo.setFaultReportId(rescue.getFaultReportId());
        vo.setTrappedCount(rescue.getTrappedCount());
        vo.setTrappedFloor(rescue.getTrappedFloor());
        vo.setReporterName(rescue.getReporterName());
        vo.setReporterPhone(rescue.getReporterPhone());
        vo.setStatus(rescue.getStatus().name());
        vo.setStatusText(getStatusText(rescue.getStatus()));
        vo.setReportTime(rescue.getReportTime());
        vo.setArrivalTime(rescue.getArrivalTime());
        vo.setRescuedTime(rescue.getRescuedTime());
        vo.setCompleteTime(rescue.getCompleteTime());
        vo.setRescuerId(rescue.getRescuerId());
        vo.setRescueProcess(rescue.getRescueProcess());
        vo.setEntrapmentReason(rescue.getEntrapmentReason());
        vo.setHasInjury(rescue.getHasInjury());
        vo.setInjuryDescription(rescue.getInjuryDescription());
        vo.setSolution(rescue.getSolution());
        vo.setRemark(rescue.getRemark());
        vo.setInitialRemark(rescue.getInitialRemark());
        if (rescue.getExportStatus() != null) {
            vo.setExportStatus(rescue.getExportStatus().name());
            vo.setExportStatusText(getExportStatusText(rescue.getExportStatus()));
        }
        vo.setAttachmentCount(rescue.getAttachmentCount());
        if (rescue.getNotificationStatus() != null) {
            vo.setNotificationStatus(rescue.getNotificationStatus().name());
            vo.setNotificationStatusText(getNotificationStatusText(rescue.getNotificationStatus()));
        }
        vo.setCreateTime(rescue.getCreateTime());
        vo.setUpdateTime(rescue.getUpdateTime());

        elevatorRepository.findById(rescue.getElevatorId())
                .ifPresent(e -> vo.setElevatorNo(e.getElevatorNo()));

        if (rescue.getRescuerId() != null) {
            sysUserRepository.findById(rescue.getRescuerId())
                    .ifPresent(u -> vo.setRescuerName(u.getName()));
        }

        if (rescue.getFaultReportId() != null) {
            faultReportRepository.findById(rescue.getFaultReportId())
                    .ifPresent(f -> {
                        vo.setFaultReportNo(f.getReportNo());
                        vo.setFaultType(f.getFaultType());
                        vo.setFaultDescription(f.getFaultDescription());
                        vo.setFaultRemark(f.getRemark());
                        vo.setFaultSolution(f.getSolution());
                        if (f.getHandlerId() != null) {
                            sysUserRepository.findById(f.getHandlerId())
                                    .ifPresent(u -> vo.setFaultHandlerName(u.getName()));
                        }
                        List<HandleRecord> faultRecords = handleRecordService.getRecords(RecordType.FAULT_REPORT, f.getId());
                        for (HandleRecord rec : faultRecords) {
                            if ("转困人处置".equals(rec.getAction())) {
                                vo.setFaultTransferRemark(rec.getContent());
                                vo.setFaultTransferOperatorName(rec.getOperatorName());
                                vo.setFaultTransferTime(rec.getOperateTime());
                                break;
                            }
                        }
                    });
        }

        vo.setRecords(handleRecordService.getRecords(RecordType.ENTRAPMENT_RESCUE, id));

        if (rescue.getFaultReportId() != null) {
            List<HandleRecord> faultRecs = handleRecordService.getRecords(RecordType.FAULT_REPORT, rescue.getFaultReportId());
            vo.setFaultRecords(faultRecs);
        }

        vo.setTimeline(buildRescueTimeline(rescue, vo));
        vo.setRemarkChain(buildRescueRemarkChain(rescue, vo));

        return vo;
    }

    private List<TimelineEventVO> buildRescueTimeline(EntrapmentRescue rescue, RescueDetailVO detail) {
        List<TimelineEventVO> timeline = new ArrayList<>();

        if (rescue.getFaultReportId() != null) {
            faultReportRepository.findById(rescue.getFaultReportId()).ifPresent(fault -> {
                TimelineEventVO faultCreate = new TimelineEventVO();
                faultCreate.setEventType("FAULT_REPORT");
                faultCreate.setEventTypeText("[关联故障报修] 创建");
                faultCreate.setSource("FAULT_REPORT");
                faultCreate.setEventTime(fault.getCreateTime());
                faultCreate.setToStatus(FaultStatus.PENDING.name());
                faultCreate.setToStatusText(statusConstraintService.getFaultStatusText(FaultStatus.PENDING));
                faultCreate.setTitle("故障报修创建 - " + fault.getReportNo());
                faultCreate.setContent(fault.getFaultDescription());
                faultCreate.setRemark(fault.getRemark());
                faultCreate.setRelatedRecordId(fault.getId());
                faultCreate.setRelatedRecordNo(fault.getReportNo());
                timeline.add(faultCreate);

                if (detail.getFaultTransferTime() != null) {
                    TimelineEventVO transfer = new TimelineEventVO();
                    transfer.setEventType("TRANSFER_RESCUE");
                    transfer.setEventTypeText("[转单] 故障转困人处置");
                    transfer.setSource("FAULT_REPORT");
                    transfer.setEventTime(detail.getFaultTransferTime());
                    transfer.setFromStatus(FaultStatus.PROCESSING.name());
                    transfer.setFromStatusText(statusConstraintService.getFaultStatusText(FaultStatus.PROCESSING));
                    transfer.setToStatus(FaultStatus.TRANSFERRED_TO_RESCUE.name());
                    transfer.setToStatusText(statusConstraintService.getFaultStatusText(FaultStatus.TRANSFERRED_TO_RESCUE));
                    transfer.setTitle("转困人处置 - 触发创建救援工单");
                    transfer.setContent(detail.getFaultTransferRemark());
                    transfer.setOperatorName(detail.getFaultTransferOperatorName());
                    transfer.setRelatedRecordId(fault.getId());
                    transfer.setRelatedRecordNo(fault.getReportNo());
                    timeline.add(transfer);
                }

                List<HandleRecord> faultRecords = detail.getFaultRecords();
                if (faultRecords != null) {
                    for (HandleRecord fr : faultRecords) {
                        if ("创建故障报修".equals(fr.getAction())) continue;
                        if ("转困人处置".equals(fr.getAction())) continue;
                        TimelineEventVO ev = new TimelineEventVO();
                        ev.setEventType("FAULT_HANDLE");
                        ev.setEventTypeText("[关联故障报修] " + fr.getAction());
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
                        ev.setRelatedRecordId(fault.getId());
                        ev.setRelatedRecordNo(fault.getReportNo());
                        timeline.add(ev);
                    }
                }
            });
        }

        for (HandleRecord r : detail.getRecords()) {
            TimelineEventVO ev = new TimelineEventVO();
            ev.setEventType("RESCUE_HANDLE");
            ev.setEventTypeText("[困人处置] " + r.getAction());
            ev.setSource("ENTRAPMENT_RESCUE");
            ev.setEventTime(r.getOperateTime());
            ev.setFromStatus(r.getFromStatus());
            ev.setFromStatusText(r.getFromStatus() != null ? safeRescueText(r.getFromStatus()) : null);
            ev.setToStatus(r.getToStatus());
            ev.setToStatusText(r.getToStatus() != null ? safeRescueText(r.getToStatus()) : null);
            ev.setTitle(r.getAction());
            ev.setContent(r.getContent());
            ev.setOperatorId(r.getOperatorId());
            ev.setOperatorName(r.getOperatorName());
            ev.setRelatedRecordId(rescue.getId());
            ev.setRelatedRecordNo(rescue.getRescueNo());
            if ("创建困人处置".equals(r.getAction())) {
                ev.setRemark(rescue.getInitialRemark());
            }
            timeline.add(ev);
        }

        timeline.sort(Comparator.comparing(TimelineEventVO::getEventTime, Comparator.nullsLast(Comparator.naturalOrder())));
        return timeline;
    }

    private List<Map<String, Object>> buildRescueRemarkChain(EntrapmentRescue rescue, RescueDetailVO detail) {
        List<Map<String, Object>> chain = new ArrayList<>();
        int seq = 0;

        if (rescue.getFaultReportId() != null) {
            faultReportRepository.findById(rescue.getFaultReportId()).ifPresent(fault -> {
                if (fault.getRemark() != null && !fault.getRemark().isEmpty()) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("seq", 0);
                    m.put("source", "FAULT_REPORT_LATEST");
                    m.put("sourceText", "故障报修-最新备注");
                    m.put("recordNo", fault.getReportNo());
                    m.put("content", fault.getRemark());
                    m.put("capturedAt", fault.getUpdateTime());
                    m.put("autoInherited", true);
                    chain.add(m);
                }
            });

            List<HandleRecord> faultRecs = detail.getFaultRecords();
            if (faultRecs != null) {
                for (HandleRecord fr : faultRecs) {
                    if (fr.getContent() == null || fr.getContent().isEmpty()) continue;
                    if ("创建故障报修".equals(fr.getAction())) continue;
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("seq", chain.size());
                    m.put("source", "FAULT_RECORD");
                    m.put("sourceText", "故障报修处理记录-" + fr.getAction());
                    m.put("recordNo", detail.getFaultReportNo());
                    m.put("content", fr.getContent());
                    m.put("operatorName", fr.getOperatorName());
                    m.put("time", fr.getOperateTime());
                    m.put("autoInherited", true);
                    chain.add(m);
                }
            }
        }

        if (rescue.getInitialRemark() != null && !rescue.getInitialRemark().isEmpty()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("seq", chain.size());
            m.put("source", "INITIAL_REMARK_SNAPSHOT");
            m.put("sourceText", "转单时备注快照(initialRemark)");
            m.put("recordNo", rescue.getRescueNo());
            m.put("content", rescue.getInitialRemark());
            m.put("capturedAt", rescue.getCreateTime());
            m.put("autoInherited", true);
            m.put("note", "创建困人处置工单时从故障报修 remark 字段快照复制,用于后续处理上下文参考");
            chain.add(m);
        }

        for (HandleRecord r : detail.getRecords()) {
            if (r.getContent() == null || r.getContent().isEmpty()) continue;
            if ("创建困人处置".equals(r.getAction())) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("seq", chain.size());
            m.put("source", "RESCUE_RECORD");
            m.put("sourceText", "困人处置记录-" + r.getAction());
            m.put("recordNo", rescue.getRescueNo());
            m.put("content", r.getContent());
            m.put("operatorName", r.getOperatorName());
            m.put("time", r.getOperateTime());
            m.put("autoInherited", false);
            chain.add(m);
        }

        if (rescue.getRemark() != null && !rescue.getRemark().isEmpty() && !rescue.getRemark().equals(rescue.getInitialRemark())) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("seq", chain.size());
            m.put("source", "RESCUE_LATEST_REMARK");
            m.put("sourceText", "困人处置-最新备注");
            m.put("recordNo", rescue.getRescueNo());
            m.put("content", rescue.getRemark());
            m.put("capturedAt", rescue.getUpdateTime());
            m.put("autoInherited", false);
            chain.add(m);
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

    public List<EntrapmentRescue> listByElevator(Long elevatorId) {
        return entrapmentRescueRepository.findByElevatorIdOrderByCreateTimeDesc(elevatorId);
    }

    public List<EntrapmentRescue> listByStatus(RescueStatus status) {
        return entrapmentRescueRepository.findByStatusOrderByCreateTimeDesc(status);
    }

    public List<EntrapmentRescue> listAll() {
        return entrapmentRescueRepository.findAll();
    }

    private String generateRescueNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "ER" + date + uuid;
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

    private String buildCreateContent(RescueCreateDTO dto) {
        StringBuilder sb = new StringBuilder();
        sb.append("创建困人处置工单");
        sb.append("，被困人数：").append(dto.getTrappedCount());
        if (dto.getTrappedFloor() != null) {
            sb.append("，困人楼层：").append(dto.getTrappedFloor());
        }
        if (dto.getReporterName() != null) {
            sb.append("，报案人：").append(dto.getReporterName());
        }
        if (dto.getInitialRemark() != null) {
            sb.append("，初始备注：").append(dto.getInitialRemark());
        }
        if (dto.getFaultReportId() != null) {
            sb.append("，关联故障报修ID：").append(dto.getFaultReportId());
        }
        return sb.toString();
    }
}
