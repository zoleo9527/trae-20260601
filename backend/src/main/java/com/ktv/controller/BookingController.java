package com.ktv.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ktv.common.PageQuery;
import com.ktv.common.Result;
import com.ktv.entity.Booking;
import com.ktv.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/booking")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @GetMapping("/page")
    public Result<Page<Booking>> page(PageQuery query) {
        return Result.success(bookingService.pageList(query));
    }

    @GetMapping("/{id}")
    public Result<Booking> getById(@PathVariable Long id) {
        return Result.success(bookingService.getById(id));
    }

    @GetMapping("/no/{bookingNo}")
    public Result<Booking> getByBookingNo(@PathVariable String bookingNo) {
        return Result.success(bookingService.getByBookingNo(bookingNo));
    }

    @PostMapping
    public Result<Long> create(@RequestBody Booking booking) {
        bookingService.save(booking);
        return Result.success(booking.getId());
    }

    @PutMapping
    public Result<Boolean> update(@RequestBody Booking booking) {
        return Result.success(bookingService.updateById(booking));
    }
}
