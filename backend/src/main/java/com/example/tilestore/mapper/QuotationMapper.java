package com.example.tilestore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.tilestore.entity.Quotation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface QuotationMapper extends BaseMapper<Quotation> {

    @Select("SELECT q.* FROM quotation q WHERE q.measurement_id = #{measurementId} ORDER BY q.created_at DESC")
    List<Quotation> findByMeasurementId(@Param("measurementId") Long measurementId);

    @Select("SELECT q.* FROM quotation q WHERE q.designer_id = #{designerId} ORDER BY q.created_at DESC")
    List<Quotation> findByDesignerId(@Param("designerId") Long designerId);

    @Select("SELECT q.* FROM quotation q WHERE q.customer_id = #{customerId} ORDER BY q.created_at DESC")
    List<Quotation> findByCustomerId(@Param("customerId") Long customerId);

    @Select("SELECT q.* FROM quotation q WHERE q.status = #{status} ORDER BY q.created_at DESC")
    List<Quotation> findByStatus(@Param("status") String status);
}