package com.security.survey.repository;

import com.security.survey.entity.Remark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RemarkRepository extends JpaRepository<Remark, Long> {
    List<Remark> findBySourceTypeAndSourceIdOrderByCreatedAtDesc(String sourceType, Long sourceId);
    List<Remark> findBySourceTypeAndSourceIdAndInheritedTrueOrderByCreatedAtDesc(String sourceType, Long sourceId);
}
