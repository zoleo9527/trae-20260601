package com.example.tilestore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.tilestore.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProductMapper extends BaseMapper<Product> {

    @Select("SELECT * FROM product WHERE status = 1 ORDER BY category, name")
    List<Product> findAllActive();

    @Select("SELECT * FROM product WHERE category = #{category} AND status = 1 ORDER BY name")
    List<Product> findByCategory(@Param("category") String category);

    @Select("SELECT * FROM product WHERE code = #{code}")
    Product findByCode(@Param("code") String code);
}