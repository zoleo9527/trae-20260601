
package com.example.recruitment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.recruitment.entity.CandidateApplication;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface CandidateApplicationMapper extends BaseMapper<CandidateApplication> {

    IPage<CandidateApplication> selectPageWithFilters(Page<CandidateApplication> page,
                                                      @Param("positionId") Long positionId,
                                                      @Param("status") Integer status,
                                                      @Param("candidateName") String candidateName,
                                                      @Param("candidatePhone") String candidatePhone,
                                                      @Param("startTime") LocalDateTime startTime,
                                                      @Param("endTime") LocalDateTime endTime);

    List<CandidateApplication> selectTodayPending();

    List<CandidateApplication> selectTimeoutApplications();

    List<CandidateApplication> selectRecentlyRejected();
}
