package com.ktv.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ktv.entity.Drink;
import com.ktv.mapper.DrinkMapper;
import com.ktv.service.DrinkService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DrinkServiceImpl extends ServiceImpl<DrinkMapper, Drink> implements DrinkService {
    @Override
    public List<Drink> listAvailable() {
        LambdaQueryWrapper<Drink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Drink::getStatus, 1).gt(Drink::getStock, 0);
        return list(wrapper);
    }

    @Override
    public boolean deductStock(Long drinkId, Integer quantity) {
        Drink drink = getById(drinkId);
        if (drink == null || drink.getStock() < quantity) {
            return false;
        }
        drink.setStock(drink.getStock() - quantity);
        return updateById(drink);
    }

    @Override
    public boolean restoreStock(Long drinkId, Integer quantity) {
        Drink drink = getById(drinkId);
        if (drink == null) {
            return false;
        }
        drink.setStock(drink.getStock() + quantity);
        return updateById(drink);
    }
}
