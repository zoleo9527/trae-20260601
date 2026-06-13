
package com.example.recruitment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.recruitment.entity.InterviewInvitation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface InterviewInvitationMapper extends BaseMapper<InterviewInvitation> {

    IPage<InterviewInvitation> selectPageWithFilters(Page<InterviewInvitation> page,
                                                     @Param("positionId") Long positionId,
                                                     @Param("status") Integer status,
                                                     @Param("candidateName") String candidateName,
                                                     @Param("candidatePhone") String candidatePhone,
                                                     @Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime);

    List<InterviewInvitation> selectTodayPending();

    List<InterviewInvitation> selectTimeoutInvitations();

    List<InterviewInvitation> selectRecentlyRejected();

    List<InterviewInvitation> selectByApplicationId(@Param("applicationId") Long applicationId);
}
