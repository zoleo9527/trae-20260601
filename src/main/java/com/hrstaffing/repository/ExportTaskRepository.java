package com.hrstaffing.repository;

import com.hrstaffing.entity.ExportTask;
import com.hrstaffing.enums.ExportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExportTaskRepository extends JpaRepository<ExportTask, Long> {

    List<ExportTask> findByStatus(ExportStatus status);

    Page<ExportTask> findByCreatedByOrderByCreatedAtDesc(Long createdBy, Pageable pageable);

    Page<ExportTask> findByOrderByCreatedAtDesc(Pageable pageable);
}
