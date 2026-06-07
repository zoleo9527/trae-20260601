package com.ktv.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ktv.entity.GiftVerificationItem;
import com.ktv.mapper.GiftVerificationItemMapper;
import com.ktv.service.GiftVerificationItemService;
import org.springframework.stereotype.Service;

@Service
public class GiftVerificationItemServiceImpl extends ServiceImpl<GiftVerificationItemMapper, GiftVerificationItem> implements GiftVerificationItemService {
}
