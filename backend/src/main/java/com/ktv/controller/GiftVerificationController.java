package com.ktv.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ktv.common.Result;
import com.ktv.dto.GiftVerificationDTO;
import com.ktv.dto.GiftVerificationQueryDTO;
import com.ktv.entity.GiftVerification;
import com.ktv.entity.GiftVerificationItem;
import com.ktv.service.GiftVerificationService;
import com.ktv.vo.GiftVerificationDetailVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/verification")
public class GiftVerificationController {

    @Autowired
    private GiftVerificationService giftVerificationService;

    @PostMapping
    public Result<Long> create(@RequestBody GiftVerificationDTO dto,
                               @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        return Result.success(giftVerificationService.createVerification(dto, userId));
    }

    @GetMapping("/page")
    public Result<Page<GiftVerification>> page(GiftVerificationQueryDTO query) {
        return Result.success(giftVerificationService.pageList(query));
    }

    @GetMapping("/{id}")
    public Result<GiftVerification> getById(@PathVariable Long id) {
        return Result.success(giftVerificationService.getDetail(id));
    }

    @GetMapping("/{id}/detail")
    public Result<GiftVerificationDetailVO> getDetail(@PathVariable Long id) {
        return Result.success(giftVerificationService.getDetailWithRelations(id));
    }

    @GetMapping("/{id}/items")
    public Result<List<GiftVerificationItem>> getItems(@PathVariable Long id) {
        return Result.success(giftVerificationService.getItems(id));
    }

    @GetMapping("/booking/{bookingId}/used-amount")
    public Result<BigDecimal> getBookingUsedAmount(@PathVariable Long bookingId) {
        return Result.success(giftVerificationService.getBookingUsedAmount(bookingId));
    }

    @GetMapping("/booking/{bookingId}/remaining-amount")
    public Result<BigDecimal> getBookingRemainingAmount(@PathVariable Long bookingId) {
        return Result.success(giftVerificationService.getBookingRemainingAmount(bookingId));
    }

    @PutMapping("/{id}/approve")
    public Result<Boolean> approve(@PathVariable Long id,
                                    @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        return Result.success(giftVerificationService.approveVerification(id, userId));
    }

    @PutMapping("/{id}/reject")
    public Result<Boolean> reject(@PathVariable Long id, @RequestBody Map<String, String> body,
                                   @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        String reason = body.get("reason");
        return Result.success(giftVerificationService.rejectVerification(id, userId, reason));
    }

    @GetMapping("/today/pending")
    public Result<List<GiftVerification>> getTodayPending() {
        return Result.success(giftVerificationService.getTodayPending());
    }

    @GetMapping("/timeout")
    public Result<List<GiftVerification>> getTimeout() {
        return Result.success(giftVerificationService.getTimeout());
    }

    @GetMapping("/recently-rejected")
    public Result<List<GiftVerification>> getRecentlyRejected() {
        return Result.success(giftVerificationService.getRecentlyRejected());
    }
}
