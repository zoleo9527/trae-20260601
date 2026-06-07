package com.ktv.service.impl;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ktv.dto.DrinkOutboundDTO;
import com.ktv.dto.DrinkOutboundQueryDTO;
import com.ktv.entity.*;
import com.ktv.mapper.DrinkOutboundMapper;
import com.ktv.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class DrinkOutboundServiceImpl extends ServiceImpl<DrinkOutboundMapper, DrinkOutbound> implements DrinkOutboundService {

    @Autowired
    private DrinkOutboundItemService outboundItemService;
    @Autowired
    private DrinkService drinkService;
    @Autowired
    private BookingService bookingService;
    @Autowired
    private GiftVerificationService verificationService;

    @Override
    @Transactional
    public Long createOutbound(DrinkOutboundDTO dto, Long userId) {
        LambdaQueryWrapper<DrinkOutbound> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DrinkOutbound::getIdempotentKey, dto.getIdempotentKey());
        DrinkOutbound existing = getOne(wrapper);
        if (existing != null) {
            return existing.getId();
        }

        Booking booking = null;
        if (dto.getBookingId() != null) {
            booking = bookingService.getById(dto.getBookingId());
        }

        DrinkOutbound outbound = new DrinkOutbound();
        outbound.setOutboundNo("OB" + IdUtil.getSnowflakeNextIdStr());
        outbound.setBookingId(dto.getBookingId());
        if (booking != null) {
            outbound.setBookingNo(booking.getBookingNo());
            outbound.setRoomNo(booking.getRoomNo());
        }
        outbound.setOutboundType(dto.getOutboundType());
        outbound.setStatus("PENDING");
        outbound.setRemark(dto.getRemark());
        outbound.setIdempotentKey(dto.getIdempotentKey());
        outbound.setCreateBy(userId);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<DrinkOutboundItem> items = new ArrayList<>();
        for (DrinkOutboundDTO.OutboundItemDTO itemDTO : dto.getItems()) {
            Drink drink = drinkService.getById(itemDTO.getDrinkId());
            if (drink == null) {
                continue;
            }
            BigDecimal price = itemDTO.getPrice() != null ? itemDTO.getPrice() : drink.getPrice();
            BigDecimal amount = price.multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
            totalAmount = totalAmount.add(amount);

            DrinkOutboundItem item = new DrinkOutboundItem();
            item.setDrinkId(drink.getId());
            item.setDrinkName(drink.getDrinkName());
            item.setSpec(drink.getSpec());
            item.setUnit(drink.getUnit());
            item.setPrice(price);
            item.setQuantity(itemDTO.getQuantity());
            item.setAmount(amount);
            items.add(item);
        }
        outbound.setTotalAmount(totalAmount);
        save(outbound);

        for (DrinkOutboundItem item : items) {
            item.setOutboundId(outbound.getId());
        }
        outboundItemService.saveBatch(items);

        return outbound.getId();
    }

    @Override
    public Page<DrinkOutbound> pageList(DrinkOutboundQueryDTO query) {
        Page<DrinkOutbound> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<DrinkOutbound> wrapper = new LambdaQueryWrapper<>();
        if (query.getStatus() != null && !query.getStatus().isEmpty()) {
            wrapper.eq(DrinkOutbound::getStatus, query.getStatus());
        }
        if (query.getOutboundType() != null && !query.getOutboundType().isEmpty()) {
            wrapper.eq(DrinkOutbound::getOutboundType, query.getOutboundType());
        }
        if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
            wrapper.and(w -> w.like(DrinkOutbound::getBookingNo, query.getKeyword())
                    .or().like(DrinkOutbound::getRoomNo, query.getKeyword())
                    .or().like(DrinkOutbound::getOutboundNo, query.getKeyword()));
        }
        wrapper.orderByDesc(DrinkOutbound::getCreateTime);
        return page(page, wrapper);
    }

    @Override
    public List<DrinkOutboundItem> getItems(Long outboundId) {
        LambdaQueryWrapper<DrinkOutboundItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DrinkOutboundItem::getOutboundId, outboundId);
        return outboundItemService.list(wrapper);
    }

    @Override
    @Transactional
    public boolean completeOutbound(Long outboundId, Long userId) {
        DrinkOutbound outbound = getById(outboundId);
        if (outbound == null || !"PENDING".equals(outbound.getStatus())) {
            return false;
        }

        List<DrinkOutboundItem> items = getItems(outboundId);
        for (DrinkOutboundItem item : items) {
            if (!drinkService.deductStock(item.getDrinkId(), item.getQuantity())) {
                throw new RuntimeException("酒水库存不足：" + item.getDrinkName());
            }
        }

        outbound.setStatus("COMPLETED");
        outbound.setHandleBy(userId);
        outbound.setHandleTime(LocalDateTime.now());
        boolean result = updateById(outbound);

        if (result && outbound.getVerificationId() != null) {
            verificationService.updateOutboundStatus(outbound.getVerificationId(), "COMPLETED");
        }

        return result;
    }

    @Override
    @Transactional
    public boolean rejectOutbound(Long outboundId, Long userId, String reason) {
        DrinkOutbound outbound = getById(outboundId);
        if (outbound == null || !"PENDING".equals(outbound.getStatus())) {
            return false;
        }
        outbound.setStatus("REJECTED");
        outbound.setHandleBy(userId);
        outbound.setHandleTime(LocalDateTime.now());
        outbound.setRemark(reason != null ? reason : outbound.getRemark());
        boolean result = updateById(outbound);

        if (result && outbound.getVerificationId() != null) {
            verificationService.updateOutboundStatus(outbound.getVerificationId(), "REJECTED");
        }

        return result;
    }

    @Override
    public List<DrinkOutbound> getTodayPending() {
        LocalDateTime startOfDay = DateUtil.beginOfDay(DateUtil.date()).toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
        LocalDateTime endOfDay = DateUtil.endOfDay(DateUtil.date()).toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
        LambdaQueryWrapper<DrinkOutbound> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DrinkOutbound::getStatus, "PENDING")
                .between(DrinkOutbound::getCreateTime, startOfDay, endOfDay)
                .orderByDesc(DrinkOutbound::getCreateTime)
                .last("LIMIT 10");
        return list(wrapper);
    }

    @Override
    public List<DrinkOutbound> getTimeout() {
        LocalDateTime timeoutTime = LocalDateTime.now().minus(2, ChronoUnit.HOURS);
        LambdaQueryWrapper<DrinkOutbound> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DrinkOutbound::getStatus, "PENDING")
                .lt(DrinkOutbound::getCreateTime, timeoutTime)
                .orderByDesc(DrinkOutbound::getCreateTime)
                .last("LIMIT 10");
        return list(wrapper);
    }

    @Override
    public List<DrinkOutbound> getRecentlyRejected() {
        LocalDateTime startTime = LocalDateTime.now().minus(24, ChronoUnit.HOURS);
        LambdaQueryWrapper<DrinkOutbound> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DrinkOutbound::getStatus, "REJECTED")
                .ge(DrinkOutbound::getHandleTime, startTime)
                .orderByDesc(DrinkOutbound::getHandleTime)
                .last("LIMIT 10");
        return list(wrapper);
    }
}
