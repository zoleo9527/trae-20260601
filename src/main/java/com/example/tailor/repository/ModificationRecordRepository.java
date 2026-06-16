package com.example.tailor.repository;

import com.example.tailor.entity.ModificationRecord;
import com.example.tailor.enums.ModificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModificationRecordRepository extends JpaRepository<ModificationRecord, Long> {
    Optional<ModificationRecord> findByModificationNo(String modificationNo);
    Page<ModificationRecord> findByFeedbackId(Long feedbackId, Pageable pageable);
    Page<ModificationRecord> findByOrderId(Long orderId, Pageable pageable);
    Page<ModificationRecord> findByStatus(ModificationStatus status, Pageable pageable);
    Page<ModificationRecord> findByResponsibleRole(String responsibleRole, Pageable pageable);
    Page<ModificationRecord> findByAssigneeId(Long assigneeId, Pageable pageable);
    List<ModificationRecord> findByFeedbackId(Long feedbackId);
}