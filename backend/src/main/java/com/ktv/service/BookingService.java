package com.ktv.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ktv.common.PageQuery;
import com.ktv.entity.Booking;

public interface BookingService extends IService<Booking> {
    Page<Booking> pageList(PageQuery query);
    Booking getByBookingNo(String bookingNo);
}
