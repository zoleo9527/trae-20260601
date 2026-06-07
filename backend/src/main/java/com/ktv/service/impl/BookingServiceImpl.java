package com.ktv.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ktv.common.PageQuery;
import com.ktv.entity.Booking;
import com.ktv.mapper.BookingMapper;
import com.ktv.service.BookingService;
import org.springframework.stereotype.Service;

@Service
public class BookingServiceImpl extends ServiceImpl<BookingMapper, Booking> implements BookingService {
    @Override
    public Page<Booking> pageList(PageQuery query) {
        Page<Booking> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<Booking> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Booking::getCreateTime);
        return page(page, wrapper);
    }

    @Override
    public Booking getByBookingNo(String bookingNo) {
        LambdaQueryWrapper<Booking> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Booking::getBookingNo, bookingNo);
        return getOne(wrapper);
    }
}
