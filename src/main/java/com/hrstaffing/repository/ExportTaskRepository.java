package com.hrstaffing.repository;

import com.hrstaffing.entity.ExportTask;
import com.hrstaffing.enums.ExportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExportTaskRepository extends JpaRepository<ExportTask, Long>, JpaSpecificationExecutor<ExportTask> {

    List<ExportTask> findByStatus(ExportStatus status);

    Page<ExportTask> findByCreatedByOrderByCreatedAtDesc(Long createdBy, Pageable pageable);

    Page<ExportTask> findByOrderByCreatedAtDesc(Pageable pageable);

    @Modifying
    @Query("UPDATE ExportTask e SET e.status = :status, e.failReason = :failReason, e.finishedAt = :finishedAt WHERE e.id = :id")
    int updateFailedById(@Param("id") Long id,
                         @Param("status") ExportStatus status,
                         @Param("failReason") String failReason,
                         @Param("finishedAt") LocalDateTime finishedAt);
}
