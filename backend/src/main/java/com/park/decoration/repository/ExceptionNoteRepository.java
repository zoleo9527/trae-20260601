package com.park.decoration.repository;

import com.park.decoration.entity.ExceptionNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExceptionNoteRepository extends JpaRepository<ExceptionNote, Long> {

    List<ExceptionNote> findByApplicationIdOrderByReportedAtDesc(Long applicationId);

    List<ExceptionNote> findByResolvedFalseOrderByReportedAtDesc();
}
