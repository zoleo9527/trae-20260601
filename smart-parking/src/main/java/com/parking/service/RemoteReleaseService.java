package com.parking.service;

import com.parking.dto.PageResult;
import com.parking.dto.RemoteReleaseCreateRequest;
import com.parking.dto.RemoteReleaseQuery;
import com.parking.dto.RemoteReleaseReviewRequest;
import com.parking.dto.RemoteReleaseReviewVO;
import com.parking.dto.SupplementRecordVO;
import com.parking.entity.*;
import com.parking.enums.FaultStatus;
import com.parking.enums.ReleaseStatus;
import com.parking.repository.*;
import com.parking.entity.AlertNotification;
import com.parking.repository.AlertNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RemoteReleaseService {

    private final RemoteReleaseRepository remoteReleaseRepository;
    private final GateFaultRepository gateFaultRepository;
    private final OperationRemarkRepository operationRemarkRepository;
    private final MonthlyRentalRepository monthlyRentalRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final GateRepository gateRepository;
    private final SupplementRecordRepository supplementRecordRepository;
    private final ParkingLogRepository parkingLogRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public RemoteRelease createRelease(RemoteReleaseCreateRequest request) {
        GateFault fault = gateFaultRepository.findById(request.getGateFaultId())
                .orElseThrow(() -> new IllegalArgumentException("故障记录不存在: " + request.getGateFaultId()));

        RemoteRelease release = new RemoteRelease();
        release.setGateFault(fault);
        release.setGate(fault.getGate());
        release.setPlateNumber(request.getPlateNumber());
        release.setRequestedBy(request.getRequestedBy());
        release.setRequestedAt(LocalDateTime.now());
        release.setStatus(ReleaseStatus.PENDING);

        if (fault.getHandlingRemark() != null && !fault.getHandlingRemark().isBlank()) {
            release.inheritFaultRemark(fault.getHandlingRemark());
        }

        RemoteRelease saved = remoteReleaseRepository.save(release);

        if (fault.getStatus() != FaultStatus.HANDED_OVER) {
            fault.markHandedOver();
            gateFaultRepository.save(fault);
        }

        checkMonthlyRentalMatch(saved);

        return saved;
    }

    @Transactional
    public RemoteRelease reviewRelease(RemoteReleaseReviewRequest request) {
        RemoteRelease release = remoteReleaseRepository.findById(request.getReleaseId())
                .orElseThrow(() -> new IllegalArgumentException("远程放行记录不存在: " + request.getReleaseId()));

        if (release.getStatus() != ReleaseStatus.PENDING && release.getStatus() != ReleaseStatus.SUPPLEMENTED) {
            throw new IllegalStateException("当前状态[" + release.getStatus() + "]不可审核");
        }

        OperationRemark remark = OperationRemark.fromRelease(release, request.getReviewerName(), request.getReviewRemark());
        operationRemarkRepository.save(remark);

        switch (request.getAction().toUpperCase()) {
            case "APPROVE" -> {
                release.approve(request.getReviewerName(), request.getReviewRemark());
                ParkingLog exitLog = new ParkingLog();
                exitLog.setGate(release.getGate());
                exitLog.setGateFaultId(release.getGateFault().getId());
                exitLog.setRemoteReleaseId(release.getId());
                exitLog.setPlateNumber(release.getPlateNumber());
                exitLog.setEventType("EXIT_REMOTE");
                exitLog.setOperatorName(request.getReviewerName());
                exitLog.setOperatorRole("CUSTOMER_SERVICE");
                exitLog.setEventTime(LocalDateTime.now());
                exitLog.setDetail("远程放行走场，审核意见：" + request.getReviewRemark());
                parkingLogRepository.save(exitLog);
            }
            case "REJECT" -> {
                release.reject(request.getReviewerName(), request.getReviewRemark());
                AlertNotification alert = AlertNotification.releaseRejected(release);
                alertNotificationRepository.save(alert);
            }
            case "SUPPLEMENT" -> {
                if (request.getSupplementInfo() == null || request.getSupplementInfo().isBlank()) {
                    throw new IllegalArgumentException("补录信息不能为空");
                }
                release.supplement(request.getSupplementInfo());

                SupplementRecord supplement = SupplementRecord.fromRemoteRelease(
                        release, request.getReviewerName(), request.getSupplementInfo());
                supplementRecordRepository.save(supplement);

                ParkingLog supplementLog = new ParkingLog();
                supplementLog.setGate(release.getGate());
                supplementLog.setGateFaultId(release.getGateFault().getId());
                supplementLog.setRemoteReleaseId(release.getId());
                supplementLog.setPlateNumber(release.getPlateNumber());
                supplementLog.setEventType("SUPPLEMENT");
                supplementLog.setOperatorName(request.getReviewerName());
                supplementLog.setOperatorRole("CUSTOMER_SERVICE");
                supplementLog.setEventTime(LocalDateTime.now());
                supplementLog.setDetail("远程放行补录，补录内容：" + request.getSupplementInfo());
                parkingLogRepository.save(supplementLog);

                AlertNotification alert = AlertNotification.supplementNeeded(release);
                alertNotificationRepository.save(alert);
            }
            default -> throw new IllegalArgumentException("不支持的操作: " + request.getAction());
        }

        return remoteReleaseRepository.save(release);
    }

    public RemoteReleaseReviewVO getReviewDetail(Long releaseId) {
        RemoteRelease release = remoteReleaseRepository.findById(releaseId)
                .orElseThrow(() -> new IllegalArgumentException("远程放行记录不存在: " + releaseId));

        RemoteReleaseReviewVO vo = new RemoteReleaseReviewVO();

        RemoteReleaseReviewVO.RemoteReleaseQuery releaseVO = new RemoteReleaseReviewVO.RemoteReleaseQuery();
        releaseVO.setId(release.getId());
        releaseVO.setPlateNumber(release.getPlateNumber());
        releaseVO.setStatus(release.getStatus().name());
        releaseVO.setRequestedBy(release.getRequestedBy());
        releaseVO.setRequestedAt(release.getRequestedAt() != null ? release.getRequestedAt().format(FMT) : null);
        releaseVO.setInheritedRemark(release.getInheritedRemark());
        releaseVO.setReviewRemark(release.getReviewRemark());
        releaseVO.setSupplementInfo(release.getSupplementInfo());
        vo.setReleaseInfo(releaseVO);

        GateFault fault = release.getGateFault();
        RemoteReleaseReviewVO.GateFaultQuery faultVO = new RemoteReleaseReviewVO.GateFaultQuery();
        faultVO.setId(fault.getId());
        faultVO.setFaultType(fault.getFaultType());
        faultVO.setFaultDescription(fault.getFaultDescription());
        faultVO.setStatus(fault.getStatus().name());
        faultVO.setHandlingRemark(fault.getHandlingRemark());
        faultVO.setResolvedBy(fault.getResolvedBy());
        faultVO.setResolvedAt(fault.getResolvedAt() != null ? fault.getResolvedAt().format(FMT) : null);
        faultVO.setGateCode(fault.getGate().getGateCode());
        vo.setFaultInfo(faultVO);

        List<OperationRemark> remarks = operationRemarkRepository
                .findByGateFaultIdOrRemoteReleaseIdOrderByCreatedAtDesc(fault.getId(), release.getId());
        List<RemoteReleaseReviewVO.OperationRemark> remarkVOs = remarks.stream().map(r -> {
            RemoteReleaseReviewVO.OperationRemark rVO = new RemoteReleaseReviewVO.OperationRemark();
            rVO.setId(r.getId());
            rVO.setSource(r.getSource().name());
            rVO.setOperatorName(r.getOperatorName());
            rVO.setOperatorRole(r.getOperatorRole());
            rVO.setContent(r.getContent());
            rVO.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().format(FMT) : null);
            return rVO;
        }).collect(Collectors.toList());
        vo.setRemarks(remarkVOs);

        List<com.parking.entity.SupplementRecord> supplements = supplementRecordRepository
                .findByRemoteReleaseIdOrderByCreatedAtDesc(release.getId());
        List<SupplementRecordVO> supplementVOs = supplements.stream()
                .map(SupplementRecordVO::fromEntity)
                .collect(Collectors.toList());
        vo.setSupplementRecords(supplementVOs);

        Long lotId = release.getGate().getParkingLot().getId();
        boolean isMonthly = monthlyRentalRepository
                .findByPlateNumberAndParkingLotIdAndActiveTrue(release.getPlateNumber(), lotId)
                .isPresent();
        vo.setIsMonthlyRental(isMonthly);

        return vo;
    }

    public PageResult<RemoteRelease> queryReleases(RemoteReleaseQuery query) {
        PageRequest pageRequest = PageRequest.of(
                query.getPage(), query.getSize(),
                Sort.by(Sort.Direction.DESC, "requestedAt"));

        ReleaseStatus status = query.getStatus() != null ? ReleaseStatus.valueOf(query.getStatus()) : null;
        LocalDateTime startTime = parseDateTime(query.getStartTime());
        LocalDateTime endTime = parseDateTime(query.getEndTime());

        Page<RemoteRelease> page = remoteReleaseRepository.findByFilters(
                status, query.getGateId(), query.getPlateNumber(),
                query.getRequestedBy(), startTime, endTime, pageRequest);

        return PageResult.of(page);
    }

    public List<RemoteRelease> getReleasesByFaultId(Long faultId) {
        return remoteReleaseRepository.findByGateFaultId(faultId, PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "requestedAt")))
                .getContent();
    }

    private void checkMonthlyRentalMatch(RemoteRelease release) {
        Long lotId = release.getGate().getParkingLot().getId();
        monthlyRentalRepository.findByPlateNumberAndParkingLotIdAndActiveTrue(
                release.getPlateNumber(), lotId
        ).ifPresent(mr -> {
            AlertNotification alert = AlertNotification.supplementNeeded(release);
            alert.setMessage(alert.getMessage() + "（该车牌为月租车辆：" + mr.getOwnerName() + "，到期日：" + mr.getEndDate() + "）");
            alertNotificationRepository.save(alert);
        });
    }

    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.isBlank()) return null;
        return LocalDateTime.parse(str, FMT);
    }
}
