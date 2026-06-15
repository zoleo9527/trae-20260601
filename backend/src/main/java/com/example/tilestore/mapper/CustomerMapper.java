package com.example.tilestore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.tilestore.entity.Customer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CustomerMapper extends BaseMapper<Customer> {

    @Select("SELECT * FROM customer WHERE phone = #{phone}")
    Customer findByPhone(@Param("phone") String phone);
}