package com.parking.service;

import com.parking.dto.GateFaultHandleRequest;
import com.parking.dto.GateFaultQuery;
import com.parking.dto.PageResult;
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

@Service
@RequiredArgsConstructor
public class GateFaultService {

    private final GateFaultRepository gateFaultRepository;
    private final GateRepository gateRepository;
    private final RemoteReleaseRepository remoteReleaseRepository;
    private final OperationRemarkRepository operationRemarkRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final MonthlyRentalRepository monthlyRentalRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int FAULT_TIMEOUT_MINUTES = 30;
    private static final int ABNORMAL_FREQUENCY_THRESHOLD = 3;
    private static final int ABNORMAL_FREQUENCY_HOURS = 24;

    @Transactional
    public GateFault reportFault(Long gateId, String faultType, String description, String reportedBy) {
        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new IllegalArgumentException("道闸不存在: " + gateId));

        GateFault fault = new GateFault();
        fault.setGate(gate);
        fault.setFaultType(faultType);
        fault.setFaultDescription(description);
        fault.setReportedBy(reportedBy);
        fault.setReportedAt(LocalDateTime.now());
        fault.setStatus(FaultStatus.PENDING);

        GateFault saved = gateFaultRepository.save(fault);

        checkAbnormalFrequency(gateId);

        return saved;
    }

    @Transactional
    public GateFault handleFault(GateFaultHandleRequest request) {
        GateFault fault = gateFaultRepository.findById(request.getFaultId())
                .orElseThrow(() -> new IllegalArgumentException("故障记录不存在: " + request.getFaultId()));

        if (fault.getStatus() == FaultStatus.HANDED_OVER) {
            throw new IllegalStateException("故障已移交远程放行，不可重复处理");
        }

        fault.markProcessing(request.getHandlerName());

        OperationRemark remark = OperationRemark.fromFault(fault, request.getHandlingRemark());
        operationRemarkRepository.save(remark);

        if (Boolean.TRUE.equals(request.getNeedRemoteRelease())) {
            if (request.getPlateNumber() == null || request.getPlateNumber().isBlank()) {
                throw new IllegalArgumentException("需要远程放行时车牌号不能为空");
            }
            fault.setHandlingRemark(request.getHandlingRemark());
            fault.markHandedOver();

            RemoteRelease release = new RemoteRelease();
            release.setGateFault(fault);
            release.setGate(fault.getGate());
            release.setPlateNumber(request.getPlateNumber());
            release.setRequestedBy(request.getHandlerName());
            release.setRequestedAt(LocalDateTime.now());
            release.setStatus(ReleaseStatus.PENDING);
            release.inheritFaultRemark(request.getHandlingRemark());

            remoteReleaseRepository.save(release);

            checkMonthlyRentalMatch(release);
        } else {
            fault.markResolved(request.getHandlingRemark());
        }

        return gateFaultRepository.save(fault);
    }

    public PageResult<GateFault> queryFaults(GateFaultQuery query) {
        PageRequest pageRequest = PageRequest.of(
                query.getPage(), query.getSize(),
                Sort.by(Sort.Direction.DESC, "reportedAt"));

        FaultStatus status = query.getStatus() != null ? FaultStatus.valueOf(query.getStatus()) : null;
        LocalDateTime startTime = parseDateTime(query.getStartTime());
        LocalDateTime endTime = parseDateTime(query.getEndTime());

        Page<GateFault> page = gateFaultRepository.findByFilters(
                status, query.getGateId(), query.getFaultType(),
                query.getReportedBy(), startTime, endTime, pageRequest);

        return PageResult.of(page);
    }

    public List<OperationRemark> getFaultRemarks(Long faultId) {
        return operationRemarkRepository.findByGateFaultIdOrderByCreatedAtDesc(faultId);
    }

    @Transactional
    public List<AlertNotification> checkTimeoutFaults() {
        LocalDateTime deadline = LocalDateTime.now().minusMinutes(FAULT_TIMEOUT_MINUTES);
        List<GateFault> overdueFaults = gateFaultRepository.findOverdueFaults(FaultStatus.PENDING, deadline);

        List<AlertNotification> alerts = new java.util.ArrayList<>();
        for (GateFault fault : overdueFaults) {
            AlertNotification alert = AlertNotification.faultTimeout(fault);
            alertNotificationRepository.save(alert);
            alerts.add(alert);

            fault.markProcessing("SYSTEM_AUTO");
            gateFaultRepository.save(fault);
        }
        return alerts;
    }

    private void checkAbnormalFrequency(Long gateId) {
        LocalDateTime since = LocalDateTime.now().minusHours(ABNORMAL_FREQUENCY_HOURS);
        int count = gateFaultRepository.countByGateIdSince(gateId, since);

        if (count >= ABNORMAL_FREQUENCY_THRESHOLD) {
            AlertNotification alert = AlertNotification.abnormalFrequency(gateId, count);
            alertNotificationRepository.save(alert);
        }
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
