package com.ktv.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ktv.entity.DrinkOutboundItem;
import com.ktv.mapper.DrinkOutboundItemMapper;
import com.ktv.service.DrinkOutboundItemService;
import org.springframework.stereotype.Service;

@Service
public class DrinkOutboundItemServiceImpl extends ServiceImpl<DrinkOutboundItemMapper, DrinkOutboundItem> implements DrinkOutboundItemService {
}
