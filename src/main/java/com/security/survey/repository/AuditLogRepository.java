package com.security.survey.repository;

import com.security.survey.entity.AuditLog;
import com.security.survey.enums.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTargetTypeAndTargetIdOrderByPerformedAtDesc(String targetType, Long targetId);
    List<AuditLog> findByPerformedByIdOrderByPerformedAtDesc(Long performedById);
    List<AuditLog> findByTargetTypeAndTargetIdAndActionOrderByPerformedAtDesc(String targetType, Long targetId, AuditAction action);
}
