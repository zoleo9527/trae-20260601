package com.parking.config;

import com.parking.service.AlertNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FaultTimeoutScheduler {

    private final AlertNotificationService alertNotificationService;

    @Scheduled(fixedRate = 300000)
    public void checkFaultTimeout() {
        log.debug("定时检查道闸故障超时...");
        var alerts = alertNotificationService.triggerTimeoutCheck();
        if (!alerts.isEmpty()) {
            log.info("发现{}条超时故障告警", alerts.size());
        }
    }
}
