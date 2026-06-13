
package com.example.recruitment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.recruitment.entity.SystemLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SystemLogMapper extends BaseMapper<SystemLog> {

    List<SystemLog> selectByTargetTypeAndId(@Param("targetType") String targetType, @Param("targetId") Long targetId);

    List<SystemLog> selectByModule(@Param("module") String module);

    List<SystemLog> selectByApplicationId(@Param("applicationId") Long applicationId);

    List<SystemLog> selectByInterviewId(@Param("interviewId") Long interviewId);
}
