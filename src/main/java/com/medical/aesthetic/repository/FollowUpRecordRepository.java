package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.FollowUpRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowUpRecordRepository extends JpaRepository<FollowUpRecord, Long> {

    List<FollowUpRecord> findByCustomerProjectIdOrderByFollowUpTimeDesc(Long customerProjectId);

    List<FollowUpRecord> findByFollowedById(Long followedById);
}
