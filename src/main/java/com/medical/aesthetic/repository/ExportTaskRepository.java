package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.ExportTask;
import com.medical.aesthetic.enums.ExportTaskStatus;
import com.medical.aesthetic.enums.ExportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExportTaskRepository extends JpaRepository<ExportTask, Long> {

    List<ExportTask> findByStatusOrderByCreatedAtDesc(ExportTaskStatus status);

    List<ExportTask> findByExportTypeOrderByCreatedAtDesc(ExportType exportType);

    List<ExportTask> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    List<ExportTask> findAllByOrderByCreatedAtDesc();

    @Query("SELECT t FROM ExportTask t WHERE t.createdAt BETWEEN :start AND :end ORDER BY t.createdAt DESC")
    List<ExportTask> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT t FROM ExportTask t WHERE t.status IN :statuses ORDER BY t.createdAt DESC")
    List<ExportTask> findByStatuses(@Param("statuses") List<ExportTaskStatus> statuses);

    @Query("SELECT t FROM ExportTask t WHERE t.status = 'PENDING' ORDER BY t.createdAt ASC")
    List<ExportTask> findPendingTasks();

    List<ExportTask> findTop10ByOrderByCreatedAtDesc();
}
