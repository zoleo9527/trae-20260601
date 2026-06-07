package com.ktv.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ktv.entity.Drink;
import java.util.List;

public interface DrinkService extends IService<Drink> {
    List<Drink> listAvailable();
    boolean deductStock(Long drinkId, Integer quantity);
    boolean restoreStock(Long drinkId, Integer quantity);
}
