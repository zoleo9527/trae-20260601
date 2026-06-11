package com.security.survey.repository;

import com.security.survey.entity.PointSurvey;
import com.security.survey.entity.User;
import com.security.survey.enums.SurveyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PointSurveyRepository extends JpaRepository<PointSurvey, Long> {
    List<PointSurvey> findByStatus(SurveyStatus status);
    List<PointSurvey> findByAssignedTo(User assignedTo);
    List<PointSurvey> findByStuckTrue();
    List<PointSurvey> findByStatusInAndStuckTrue(List<SurveyStatus> statuses);
    
    @Query("SELECT s FROM PointSurvey s WHERE s.status IN ?1 AND s.updatedAt < ?2 AND s.stuck = false")
    List<PointSurvey> findPotentiallyStuck(List<SurveyStatus> statuses, LocalDateTime threshold);
    
    List<PointSurvey> findByCreatedBy(User createdBy);
}
