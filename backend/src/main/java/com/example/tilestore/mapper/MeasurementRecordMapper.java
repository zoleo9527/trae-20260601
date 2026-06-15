package com.example.tilestore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.tilestore.entity.MeasurementRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MeasurementRecordMapper extends BaseMapper<MeasurementRecord> {

    @Select("SELECT mr.* FROM measurement_record mr " +
            "LEFT JOIN customer c ON mr.customer_id = c.id " +
            "WHERE mr.salesman_id = #{salesmanId} ORDER BY mr.created_at DESC")
    List<MeasurementRecord> findBySalesmanId(@Param("salesmanId") Long salesmanId);

    @Select("SELECT mr.* FROM measurement_record mr " +
            "LEFT JOIN customer c ON mr.customer_id = c.id " +
            "WHERE mr.designer_id = #{designerId} ORDER BY mr.created_at DESC")
    List<MeasurementRecord> findByDesignerId(@Param("designerId") Long designerId);

    @Select("SELECT mr.* FROM measurement_record mr " +
            "LEFT JOIN customer c ON mr.customer_id = c.id " +
            "WHERE c.phone = #{phone} ORDER BY mr.created_at DESC")
    List<MeasurementRecord> findByCustomerPhone(@Param("phone") String phone);

    @Select("SELECT mr.* FROM measurement_record mr WHERE mr.status = #{status} ORDER BY mr.created_at DESC")
    List<MeasurementRecord> findByStatus(@Param("status") String status);
}