package com.ktv.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ktv.dto.DrinkOutboundDTO;
import com.ktv.dto.DrinkOutboundQueryDTO;
import com.ktv.entity.DrinkOutbound;
import com.ktv.entity.DrinkOutboundItem;
import java.util.List;

public interface DrinkOutboundService extends IService<DrinkOutbound> {
    Long createOutbound(DrinkOutboundDTO dto, Long userId);
    Page<DrinkOutbound> pageList(DrinkOutboundQueryDTO query);
    List<DrinkOutboundItem> getItems(Long outboundId);
    boolean completeOutbound(Long outboundId, Long userId);
    boolean rejectOutbound(Long outboundId, Long userId, String reason);
    List<DrinkOutbound> getTodayPending();
    List<DrinkOutbound> getTimeout();
    List<DrinkOutbound> getRecentlyRejected();
}
