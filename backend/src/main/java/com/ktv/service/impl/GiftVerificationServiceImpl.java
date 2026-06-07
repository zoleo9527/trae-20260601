package com.ktv.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ktv.dto.GiftVerificationDTO;
import com.ktv.dto.GiftVerificationQueryDTO;
import com.ktv.entity.*;
import com.ktv.mapper.GiftVerificationMapper;
import com.ktv.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class GiftVerificationServiceImpl extends ServiceImpl<GiftVerificationMapper, GiftVerification> implements GiftVerificationService {

    @Autowired
    private GiftVerificationItemService verificationItemService;
    @Autowired
    private DrinkService drinkService;
    @Autowired
    private BookingService bookingService;

    @Override
    @Transactional
    public Long createVerification(GiftVerificationDTO dto, Long userId) {
        LambdaQueryWrapper<GiftVerification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GiftVerification::getIdempotentKey, dto.getIdempotentKey());
        GiftVerification existing = getOne(wrapper);
        if (existing != null) {
            return existing.getId();
        }

        Booking booking = bookingService.getById(dto.getBookingId());
        if (booking == null) {
            throw new RuntimeException("预订记录不存在");
        }

        BigDecimal totalUsed = BigDecimal.ZERO;
        List<GiftVerificationItem> items = new ArrayList<>();
        for (GiftVerificationDTO.VerificationItemDTO itemDTO : dto.getItems()) {
            Drink drink = drinkService.getById(itemDTO.getDrinkId());
            if (drink == null) {
                continue;
            }
            BigDecimal price = itemDTO.getPrice() != null ? itemDTO.getPrice() : drink.getPrice();
            BigDecimal amount = price.multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
            totalUsed = totalUsed.add(amount);

            GiftVerificationItem item = new GiftVerificationItem();
            item.setDrinkId(drink.getId());
            item.setDrinkName(drink.getDrinkName());
            item.setSpec(drink.getSpec());
            item.setUnit(drink.getUnit());
            item.setPrice(price);
            item.setQuantity(itemDTO.getQuantity());
            item.setAmount(amount);
            items.add(item);
        }

        if (dto.getUsedAmount() != null) {
            totalUsed = dto.getUsedAmount();
        }

        BigDecimal remaining = booking.getGiftAmount().subtract(totalUsed);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("核销金额超过赠送额度");
        }

        GiftVerification verification = new GiftVerification();
        verification.setVerificationNo("GV" + IdUtil.getSnowflakeNextIdStr());
        verification.setBookingId(booking.getId());
        verification.setBookingNo(booking.getBookingNo());
        verification.setRoomNo(booking.getRoomNo());
        verification.setCustomerName(booking.getCustomerName());
        verification.setMemberId(booking.getMemberId());
        verification.setGiftAmount(booking.getGiftAmount());
        verification.setUsedAmount(totalUsed);
        verification.setRemainingAmount(remaining);
        verification.setStatus("PENDING");
        verification.setRemark(dto.getRemark());
        verification.setIdempotentKey(dto.getIdempotentKey());
        verification.setCreateBy(userId);
        save(verification);

        for (GiftVerificationItem item : items) {
            item.setVerificationId(verification.getId());
        }
        verificationItemService.saveBatch(items);

        return verification.getId();
    }

    @Override
    public Page<GiftVerification> pageList(GiftVerificationQueryDTO query) {
        Page<GiftVerification> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<GiftVerification> wrapper = new LambdaQueryWrapper<>();
        if (query.getStatus() != null && !query.getStatus().isEmpty()) {
            wrapper.eq(GiftVerification::getStatus, query.getStatus());
        }
        if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
            wrapper.and(w -> w.like(GiftVerification::getBookingNo, query.getKeyword())
                    .or().like(GiftVerification::getRoomNo, query.getKeyword())
                    .or().like(GiftVerification::getCustomerName, query.getKeyword())
                    .or().like(GiftVerification::getVerificationNo, query.getKeyword()));
        }
        if (query.getStartDate() != null && !query.getStartDate().isEmpty()) {
            wrapper.ge(GiftVerification::getCreateTime, LocalDate.parse(query.getStartDate()).atStartOfDay());
        }
        if (query.getEndDate() != null && !query.getEndDate().isEmpty()) {
            wrapper.le(GiftVerification::getCreateTime, LocalDate.parse(query.getEndDate()).atTime(LocalTime.MAX));
        }
        wrapper.orderByDesc(GiftVerification::getCreateTime);
        return page(page, wrapper);
    }

    @Override
    public List<GiftVerificationItem> getItems(Long verificationId) {
        LambdaQueryWrapper<GiftVerificationItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GiftVerificationItem::getVerificationId, verificationId);
        return verificationItemService.list(wrapper);
    }

    @Override
    @Transactional
    public boolean approveVerification(Long verificationId, Long userId) {
        GiftVerification verification = getById(verificationId);
        if (verification == null || !"PENDING".equals(verification.getStatus())) {
            return false;
        }

        List<GiftVerificationItem> items = getItems(verificationId);
        for (GiftVerificationItem item : items) {
            if (!drinkService.deductStock(item.getDrinkId(), item.getQuantity())) {
                throw new RuntimeException("酒水库存不足：" + item.getDrinkName());
            }
        }

        verification.setStatus("COMPLETED");
        verification.setHandleBy(userId);
        verification.setHandleTime(LocalDateTime.now());
        return updateById(verification);
    }

    @Override
    @Transactional
    public boolean rejectVerification(Long verificationId, Long userId, String reason) {
        GiftVerification verification = getById(verificationId);
        if (verification == null || !"PENDING".equals(verification.getStatus())) {
            return false;
        }
        verification.setStatus("REJECTED");
        verification.setRejectReason(reason);
        verification.setHandleBy(userId);
        verification.setHandleTime(LocalDateTime.now());
        return updateById(verification);
    }

    @Override
    public GiftVerification getDetail(Long id) {
        return getById(id);
    }

    @Override
    public List<GiftVerification> getTodayPending() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        LambdaQueryWrapper<GiftVerification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GiftVerification::getStatus, "PENDING")
                .between(GiftVerification::getCreateTime, startOfDay, endOfDay)
                .orderByDesc(GiftVerification::getCreateTime)
                .last("LIMIT 10");
        return list(wrapper);
    }

    @Override
    public List<GiftVerification> getTimeout() {
        LocalDateTime timeoutTime = LocalDateTime.now().minus(2, ChronoUnit.HOURS);
        LambdaQueryWrapper<GiftVerification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GiftVerification::getStatus, "PENDING")
                .lt(GiftVerification::getCreateTime, timeoutTime)
                .orderByDesc(GiftVerification::getCreateTime)
                .last("LIMIT 10");
        return list(wrapper);
    }

    @Override
    public List<GiftVerification> getRecentlyRejected() {
        LocalDateTime startTime = LocalDateTime.now().minus(24, ChronoUnit.HOURS);
        LambdaQueryWrapper<GiftVerification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GiftVerification::getStatus, "REJECTED")
                .ge(GiftVerification::getHandleTime, startTime)
                .orderByDesc(GiftVerification::getHandleTime)
                .last("LIMIT 10");
        return list(wrapper);
    }
}
