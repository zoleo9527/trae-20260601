package com.park.decoration.repository;

import com.park.decoration.entity.ExceptionNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExceptionNoteRepository extends JpaRepository<ExceptionNote, Long> {

    List<ExceptionNote> findByApplicationIdOrderByReportedAtDesc(Long applicationId);

    List<ExceptionNote> findByResolvedFalseOrderByReportedAtDesc();

    List<ExceptionNote> findByResolvedOrderByReportedAtDesc(Boolean resolved);

    List<ExceptionNote> findByResponsiblePersonContainingIgnoreCaseOrderByReportedAtDesc(String responsiblePerson);

    @Query("SELECT e FROM ExceptionNote e WHERE e.applicationNo = :applicationNo ORDER BY e.reportedAt DESC")
    List<ExceptionNote> findByApplicationNoOrderByReportedAtDesc(@Param("applicationNo") String applicationNo);

    @Query("SELECT e FROM ExceptionNote e WHERE " +
           "(:resolved IS NULL OR e.resolved = :resolved) AND " +
           "(:responsiblePerson IS NULL OR LOWER(e.responsiblePerson) LIKE LOWER(CONCAT('%', :responsiblePerson, '%'))) AND " +
           "(:applicationNo IS NULL OR e.applicationNo = :applicationNo) " +
           "ORDER BY e.reportedAt DESC")
    List<ExceptionNote> findByFilters(
            @Param("resolved") Boolean resolved,
            @Param("responsiblePerson") String responsiblePerson,
            @Param("applicationNo") String applicationNo);
}
