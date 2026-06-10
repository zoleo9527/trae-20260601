package com.parking.service;

import com.parking.dto.PageResult;
import com.parking.entity.AlertNotification;
import com.parking.repository.AlertNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertNotificationService {

    private final AlertNotificationRepository alertNotificationRepository;
    private final GateFaultService gateFaultService;

    public PageResult<AlertNotification> queryAlerts(Boolean acknowledged, String alertType, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AlertNotification> pageResult = alertNotificationRepository.findByFilters(
                acknowledged, alertType, pageRequest);
        return PageResult.of(pageResult);
    }

    public PageResult<AlertNotification> getUnacknowledgedAlerts(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AlertNotification> pageResult = alertNotificationRepository.findByAcknowledgedFalse(pageRequest);
        return PageResult.of(pageResult);
    }

    @Transactional
    public AlertNotification acknowledgeAlert(Long alertId, String operator) {
        AlertNotification alert = alertNotificationRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("告警记录不存在: " + alertId));
        alert.acknowledge(operator);
        return alertNotificationRepository.save(alert);
    }

    @Transactional
    public List<AlertNotification> triggerTimeoutCheck() {
        return gateFaultService.checkTimeoutFaults();
    }
}
