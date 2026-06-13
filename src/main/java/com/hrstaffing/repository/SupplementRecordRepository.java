package com.hrstaffing.repository;

import com.hrstaffing.entity.SupplementRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplementRecordRepository extends JpaRepository<SupplementRecord, Long> {

    List<SupplementRecord> findByExceptionIdOrderByCreatedAtDesc(Long exceptionId);

    List<SupplementRecord> findByScheduleIdOrderByCreatedAtDesc(Long scheduleId);
}
