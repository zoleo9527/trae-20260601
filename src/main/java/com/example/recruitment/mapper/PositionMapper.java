
package com.example.recruitment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.recruitment.entity.Position;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PositionMapper extends BaseMapper<Position> {

    List<Position> selectExpiredPositions();

    List<Position> selectExpiringSoonPositions(@Param("days") Integer days);
}
