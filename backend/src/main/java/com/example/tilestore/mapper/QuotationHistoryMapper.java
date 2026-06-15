package com.example.tilestore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.tilestore.entity.QuotationHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface QuotationHistoryMapper extends BaseMapper<QuotationHistory> {

    @Select("SELECT * FROM quotation_history WHERE quotation_id = #{quotationId} ORDER BY created_at DESC")
    List<QuotationHistory> findByQuotationId(@Param("quotationId") Long quotationId);
}