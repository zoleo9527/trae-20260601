package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.HistoryNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HistoryNoteRepository extends JpaRepository<HistoryNote, Long> {

    List<HistoryNote> findByCustomerProjectIdOrderByOperateTimeDesc(Long customerProjectId);

    List<HistoryNote> findByCustomerProjectIdAndNoteTypeOrderByOperateTimeDesc(Long customerProjectId, String noteType);

    @Query("SELECT hn FROM HistoryNote hn WHERE hn.customerProject.id = :projectId AND hn.operateTime BETWEEN :start AND :end " +
           "ORDER BY hn.operateTime DESC")
    List<HistoryNote> findByProjectIdAndDateRange(@Param("projectId") Long projectId,
                                                  @Param("start") LocalDateTime start,
                                                  @Param("end") LocalDateTime end);
}
