package com.park.decoration.repository;

import com.park.decoration.entity.DecorationApplication;
import com.park.decoration.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DecorationApplicationRepository extends JpaRepository<DecorationApplication, Long> {

    Optional<DecorationApplication> findByApplicationNo(String applicationNo);

    Optional<DecorationApplication> findByIdempotentKey(String idempotentKey);

    boolean existsByIdempotentKey(String idempotentKey);

    List<DecorationApplication> findByStatusInOrderByPriorityAscCreatedAtDesc(List<ApplicationStatus> statuses);

    List<DecorationApplication> findByStatusOrderByCreatedAtDesc(ApplicationStatus status);

    @Query("SELECT a FROM DecorationApplication a WHERE a.status IN :statuses ORDER BY " +
           "CASE a.priority WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END, a.createdAt DESC")
    List<DecorationApplication> findPendingApplicationsOrdered(@Param("statuses") List<ApplicationStatus> statuses);

    List<DecorationApplication> findByAssignedHandlerOrderByUpdatedAtDesc(String assignedHandler);

    @Query("SELECT a FROM DecorationApplication a ORDER BY a.updatedAt DESC")
    List<DecorationApplication> findAllOrderByUpdatedAtDesc();
}
