package com.example.tilestore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.tilestore.entity.QuotationItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface QuotationItemMapper extends BaseMapper<QuotationItem> {

    @Select("SELECT * FROM quotation_item WHERE quotation_id = #{quotationId}")
    List<QuotationItem> findByQuotationId(@Param("quotationId") Long quotationId);

    @Select("DELETE FROM quotation_item WHERE quotation_id = #{quotationId}")
    void deleteByQuotationId(@Param("quotationId") Long quotationId);
}