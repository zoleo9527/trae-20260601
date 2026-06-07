package com.ktv.controller;

import com.ktv.common.Result;
import com.ktv.entity.Drink;
import com.ktv.service.DrinkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/drink")
public class DrinkController {

    @Autowired
    private DrinkService drinkService;

    @GetMapping("/list")
    public Result<List<Drink>> list() {
        return Result.success(drinkService.list());
    }

    @GetMapping("/available")
    public Result<List<Drink>> listAvailable() {
        return Result.success(drinkService.listAvailable());
    }

    @GetMapping("/{id}")
    public Result<Drink> getById(@PathVariable Long id) {
        return Result.success(drinkService.getById(id));
    }

    @PostMapping
    public Result<Long> create(@RequestBody Drink drink) {
        drinkService.save(drink);
        return Result.success(drink.getId());
    }

    @PutMapping
    public Result<Boolean> update(@RequestBody Drink drink) {
        return Result.success(drinkService.updateById(drink));
    }
}
