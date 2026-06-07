package com.ktv.controller;

import com.ktv.common.Result;
import com.ktv.entity.DrinkOutbound;
import com.ktv.entity.GiftVerification;
import com.ktv.service.DrinkOutboundService;
import com.ktv.service.GiftVerificationService;
import com.ktv.vo.DashboardVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DrinkOutboundService drinkOutboundService;

    @Autowired
    private GiftVerificationService giftVerificationService;

    @GetMapping
    public Result<DashboardVO> getDashboard() {
        List<DrinkOutbound> pendingOutbound = drinkOutboundService.getTodayPending();
        List<GiftVerification> pendingVerification = giftVerificationService.getTodayPending();
        List<DrinkOutbound> timeoutOutbound = drinkOutboundService.getTimeout();
        List<GiftVerification> timeoutVerification = giftVerificationService.getTimeout();
        List<DrinkOutbound> rejectedOutbound = drinkOutboundService.getRecentlyRejected();
        List<GiftVerification> rejectedVerification = giftVerificationService.getRecentlyRejected();

        DashboardVO vo = new DashboardVO();
        vo.setPendingOutboundCount((long) pendingOutbound.size());
        vo.setPendingVerificationCount((long) pendingVerification.size());
        vo.setTimeoutCount((long) (timeoutOutbound.size() + timeoutVerification.size()));
        vo.setRejectedCount((long) (rejectedOutbound.size() + rejectedVerification.size()));
        vo.setPendingOutboundList(pendingOutbound);
        vo.setPendingVerificationList(pendingVerification);
        vo.setTimeoutList(timeoutOutbound);
        vo.setRejectedList(rejectedVerification);

        return Result.success(vo);
    }
}
