package com.park.decoration.repository;

import com.park.decoration.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {

    List<OperationLog> findByApplicationIdOrderByOperatedAtDesc(Long applicationId);

    List<OperationLog> findTop20ByOrderByOperatedAtDesc();
}
