package com.park.decoration.repository;

import com.park.decoration.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {

    List<OperationLog> findByApplicationIdOrderByOperatedAtDesc(Long applicationId);

    List<OperationLog> findTop20ByOrderByOperatedAtDesc();

    Optional<OperationLog> findTopByApplicationIdOrderByOperatedAtDesc(Long applicationId);

    @Query("SELECT l FROM OperationLog l WHERE l.applicationId IN :applicationIds " +
           "AND l.operatedAt = (SELECT MAX(l2.operatedAt) FROM OperationLog l2 WHERE l2.applicationId = l.applicationId)")
    List<OperationLog> findLatestByApplicationIds(@Param("applicationIds") List<Long> applicationIds);
}
