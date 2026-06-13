package com.hrstaffing.repository;

import com.hrstaffing.entity.StatusTransitionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusTransitionLogRepository extends JpaRepository<StatusTransitionLog, Long> {

    List<StatusTransitionLog> findByBizTypeAndBizIdOrderByCreatedAtAsc(String bizType, Long bizId);

    List<StatusTransitionLog> findByBizTypeAndBizIdOrderByCreatedAtDesc(String bizType, Long bizId);
}
