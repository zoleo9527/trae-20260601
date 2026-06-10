package com.elevator.smartparking.service;

import com.elevator.smartparking.dto.RescueCreateDTO;
import com.elevator.smartparking.dto.RescueDetailVO;
import com.elevator.smartparking.dto.RescueHandleDTO;
import com.elevator.smartparking.entity.*;
import com.elevator.smartparking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EntrapmentRescueService {

    private final EntrapmentRescueRepository entrapmentRescueRepository;
    private final ElevatorRepository elevatorRepository;
    private final SysUserRepository sysUserRepository;
    private final FaultReportRepository faultReportRepository;
    private final HandleRecordService handleRecordService;

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

        if (rescue.getStatus() != RescueStatus.PENDING_RESCUE) {
            throw new IllegalStateException("当前状态不允许开始救援");
        }

        SysUser rescuer = sysUserRepository.findById(rescuerId)
                .orElseThrow(() -> new IllegalArgumentException("救援人员不存在"));

        RescueStatus oldStatus = rescue.getStatus();
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
            throw new IllegalStateException("当前状态不允许更新进度");
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

        if (rescue.getStatus() != RescueStatus.RESCUING) {
            throw new IllegalStateException("当前状态不允许完成解救");
        }

        RescueStatus oldStatus = rescue.getStatus();

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

        if (rescue.getStatus() != RescueStatus.RESCUED) {
            throw new IllegalStateException("当前状态不允许完成处置");
        }

        RescueStatus oldStatus = rescue.getStatus();

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

        if (rescue.getStatus() != RescueStatus.PENDING_RESCUE && rescue.getStatus() != RescueStatus.RESCUING) {
            throw new IllegalStateException("当前状态不允许取消");
        }

        RescueStatus oldStatus = rescue.getStatus();

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

        return vo;
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
