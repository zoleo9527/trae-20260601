package com.hrstaffing.repository;

import com.hrstaffing.entity.RejectRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RejectRecordRepository extends JpaRepository<RejectRecord, Long> {

    List<RejectRecord> findByExceptionIdOrderByCreatedAtDesc(Long exceptionId);
}
