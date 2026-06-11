package com.security.survey.repository;

import com.security.survey.entity.PlanConfirm;
import com.security.survey.entity.PointSurvey;
import com.security.survey.entity.User;
import com.security.survey.enums.ConfirmStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanConfirmRepository extends JpaRepository<PlanConfirm, Long> {
    List<PlanConfirm> findByStatus(ConfirmStatus status);
    List<PlanConfirm> findByAssignedTo(User assignedTo);
    List<PlanConfirm> findBySurvey(PointSurvey survey);
    Optional<PlanConfirm> findBySurveyId(Long surveyId);
    List<PlanConfirm> findByStuckTrue();
    List<PlanConfirm> findByStatusInAndStuckTrue(List<ConfirmStatus> statuses);
    
    @Query("SELECT p FROM PlanConfirm p WHERE p.status IN ?1 AND p.updatedAt < ?2 AND p.stuck = false")
    List<PlanConfirm> findPotentiallyStuck(List<ConfirmStatus> statuses, LocalDateTime threshold);
}
