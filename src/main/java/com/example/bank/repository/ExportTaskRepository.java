package com.example.bank.repository;

import com.example.bank.entity.ExportTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExportTaskRepository extends JpaRepository<ExportTask, Long> {

    List<ExportTask> findByStatus(String status);

    ExportTask findByTaskNo(String taskNo);

    List<ExportTask> findByExportType(String exportType);

    List<ExportTask> findByStatusOrderByCreatedAtDesc(String status);
}