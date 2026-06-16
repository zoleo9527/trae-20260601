package com.example.tailor.repository;

import com.example.tailor.entity.FittingFeedback;
import com.example.tailor.enums.FeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FittingFeedbackRepository extends JpaRepository<FittingFeedback, Long> {
    Optional<FittingFeedback> findByFeedbackNo(String feedbackNo);
    Page<FittingFeedback> findByOrderId(Long orderId, Pageable pageable);
    Page<FittingFeedback> findByStatus(FeedbackStatus status, Pageable pageable);
    Page<FittingFeedback> findByCustomerId(Long customerId, Pageable pageable);
    Page<FittingFeedback> findByFittingDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    Page<FittingFeedback> findByOrderOrderNoContaining(String orderNo, Pageable pageable);
}