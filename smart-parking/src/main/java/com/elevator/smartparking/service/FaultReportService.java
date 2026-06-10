package com.elevator.smartparking.service;

import com.elevator.smartparking.dto.FaultReportCreateDTO;
import com.elevator.smartparking.dto.FaultReportDetailVO;
import com.elevator.smartparking.dto.FaultReportHandleDTO;
import com.elevator.smartparking.dto.RescueSimpleVO;
import com.elevator.smartparking.entity.*;
import com.elevator.smartparking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FaultReportService {

    private final FaultReportRepository faultReportRepository;
    private final ElevatorRepository elevatorRepository;
    private final SysUserRepository sysUserRepository;
    private final HandleRecordService handleRecordService;
    private final EntrapmentRescueRepository entrapmentRescueRepository;

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

        if (report.getStatus() != FaultStatus.PENDING) {
            throw new IllegalStateException("当前状态不允许受理");
        }

        SysUser handler = sysUserRepository.findById(handlerId)
                .orElseThrow(() -> new IllegalArgumentException("处理人不存在"));

        FaultStatus oldStatus = report.getStatus();
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
            throw new IllegalStateException("当前状态不允许处理");
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

        if (report.getStatus() != FaultStatus.PROCESSING) {
            throw new IllegalStateException("当前状态不允许完成");
        }

        FaultStatus oldStatus = report.getStatus();

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

        if (report.getStatus() != FaultStatus.PENDING && report.getStatus() != FaultStatus.PROCESSING) {
            throw new IllegalStateException("当前状态不允许取消");
        }

        FaultStatus oldStatus = report.getStatus();

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

        if (report.getStatus() != FaultStatus.PROCESSING) {
            throw new IllegalStateException("当前状态不允许转困人处置");
        }

        if (report.getTransferRescueId() != null) {
            throw new IllegalStateException("已存在关联的困人处置工单");
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
        }
        vo.setRelatedRescues(rescueVOs);

        return vo;
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
