package com.example.tilestore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.tilestore.entity.MeasurementHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MeasurementHistoryMapper extends BaseMapper<MeasurementHistory> {

    @Select("SELECT * FROM measurement_history WHERE measurement_id = #{measurementId} ORDER BY created_at DESC")
    List<MeasurementHistory> findByMeasurementId(@Param("measurementId") Long measurementId);
}