package com.ktv.controller;

import com.ktv.common.Result;
import com.ktv.entity.DrinkOutbound;
import com.ktv.entity.GiftVerification;
import com.ktv.service.DrinkOutboundService;
import com.ktv.service.GiftVerificationService;
import com.ktv.vo.DashboardItemVO;
import com.ktv.vo.DashboardVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.ArrayList;
import java.util.Comparator;
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

        List<DashboardItemVO> timeoutList = new ArrayList<>();
        for (DrinkOutbound o : timeoutOutbound) {
            DashboardItemVO item = new DashboardItemVO();
            item.setId(o.getId());
            item.setType("OUTBOUND");
            item.setNo(o.getOutboundNo());
            item.setBookingNo(o.getBookingNo());
            item.setRoomNo(o.getRoomNo());
            item.setAmount(o.getTotalAmount());
            item.setStatus(o.getStatus());
            item.setCreateTime(o.getCreateTime());
            timeoutList.add(item);
        }
        for (GiftVerification v : timeoutVerification) {
            DashboardItemVO item = new DashboardItemVO();
            item.setId(v.getId());
            item.setType("VERIFICATION");
            item.setNo(v.getVerificationNo());
            item.setBookingNo(v.getBookingNo());
            item.setRoomNo(v.getRoomNo());
            item.setCustomerName(v.getCustomerName());
            item.setAmount(v.getUsedAmount());
            item.setStatus(v.getStatus());
            item.setCreateTime(v.getCreateTime());
            timeoutList.add(item);
        }
        timeoutList.sort(Comparator.comparing(DashboardItemVO::getCreateTime).reversed());

        List<DashboardItemVO> rejectedList = new ArrayList<>();
        for (DrinkOutbound o : rejectedOutbound) {
            DashboardItemVO item = new DashboardItemVO();
            item.setId(o.getId());
            item.setType("OUTBOUND");
            item.setNo(o.getOutboundNo());
            item.setBookingNo(o.getBookingNo());
            item.setRoomNo(o.getRoomNo());
            item.setAmount(o.getTotalAmount());
            item.setStatus(o.getStatus());
            item.setHandleTime(o.getHandleTime());
            item.setRejectReason(o.getRemark());
            rejectedList.add(item);
        }
        for (GiftVerification v : rejectedVerification) {
            DashboardItemVO item = new DashboardItemVO();
            item.setId(v.getId());
            item.setType("VERIFICATION");
            item.setNo(v.getVerificationNo());
            item.setBookingNo(v.getBookingNo());
            item.setRoomNo(v.getRoomNo());
            item.setCustomerName(v.getCustomerName());
            item.setAmount(v.getUsedAmount());
            item.setStatus(v.getStatus());
            item.setHandleTime(v.getHandleTime());
            item.setRejectReason(v.getRejectReason());
            rejectedList.add(item);
        }
        rejectedList.sort(Comparator.comparing(DashboardItemVO::getHandleTime).reversed());

        DashboardVO vo = new DashboardVO();
        vo.setPendingOutboundCount((long) pendingOutbound.size());
        vo.setPendingVerificationCount((long) pendingVerification.size());
        vo.setTimeoutCount((long) timeoutList.size());
        vo.setRejectedCount((long) rejectedList.size());
        vo.setPendingOutboundList(pendingOutbound);
        vo.setPendingVerificationList(pendingVerification);
        vo.setTimeoutList(timeoutList);
        vo.setRejectedList(rejectedList);

        return Result.success(vo);
    }
}
