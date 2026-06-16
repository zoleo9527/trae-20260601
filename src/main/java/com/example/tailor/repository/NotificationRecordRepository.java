package com.example.tailor.repository;

import com.example.tailor.entity.NotificationRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRecordRepository extends JpaRepository<NotificationRecord, Long> {
    Page<NotificationRecord> findByTargetRole(String targetRole, Pageable pageable);
    Page<NotificationRecord> findByTargetUserId(Long targetUserId, Pageable pageable);
    Page<NotificationRecord> findByRelatedOrderId(Long orderId, Pageable pageable);
    Page<NotificationRecord> findByStatus(String status, Pageable pageable);
    Page<NotificationRecord> findByTargetRoleAndStatus(String targetRole, String status, Pageable pageable);
    java.util.List<NotificationRecord> findByTargetRoleAndStatus(String targetRole, String status);
    Long countByTargetRoleAndStatus(String targetRole, String status);
}