package com.elevator.smartparking.repository;

import com.elevator.smartparking.entity.HandleRecord;
import com.elevator.smartparking.entity.RecordType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HandleRecordRepository extends JpaRepository<HandleRecord, Long> {
    List<HandleRecord> findByRecordTypeAndRecordIdOrderByOperateTimeAsc(RecordType recordType, Long recordId);
}
