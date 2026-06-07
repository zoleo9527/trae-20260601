package com.ktv.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ktv.common.Result;
import com.ktv.dto.DrinkOutboundDTO;
import com.ktv.dto.DrinkOutboundQueryDTO;
import com.ktv.entity.DrinkOutbound;
import com.ktv.entity.DrinkOutboundItem;
import com.ktv.service.DrinkOutboundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/outbound")
public class DrinkOutboundController {

    @Autowired
    private DrinkOutboundService drinkOutboundService;

    @PostMapping
    public Result<Long> create(@RequestBody DrinkOutboundDTO dto, @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        return Result.success(drinkOutboundService.createOutbound(dto, userId));
    }

    @GetMapping("/page")
    public Result<Page<DrinkOutbound>> page(DrinkOutboundQueryDTO query) {
        return Result.success(drinkOutboundService.pageList(query));
    }

    @GetMapping("/{id}")
    public Result<DrinkOutbound> getById(@PathVariable Long id) {
        return Result.success(drinkOutboundService.getById(id));
    }

    @GetMapping("/{id}/items")
    public Result<List<DrinkOutboundItem>> getItems(@PathVariable Long id) {
        return Result.success(drinkOutboundService.getItems(id));
    }

    @PutMapping("/{id}/complete")
    public Result<Boolean> complete(@PathVariable Long id, @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        return Result.success(drinkOutboundService.completeOutbound(id, userId));
    }

    @PutMapping("/{id}/reject")
    public Result<Boolean> reject(@PathVariable Long id, @RequestBody Map<String, String> body,
                                   @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        String reason = body.get("reason");
        return Result.success(drinkOutboundService.rejectOutbound(id, userId, reason));
    }

    @GetMapping("/today/pending")
    public Result<List<DrinkOutbound>> getTodayPending() {
        return Result.success(drinkOutboundService.getTodayPending());
    }

    @GetMapping("/timeout")
    public Result<List<DrinkOutbound>> getTimeout() {
        return Result.success(drinkOutboundService.getTimeout());
    }

    @GetMapping("/recently-rejected")
    public Result<List<DrinkOutbound>> getRecentlyRejected() {
        return Result.success(drinkOutboundService.getRecentlyRejected());
    }
}
