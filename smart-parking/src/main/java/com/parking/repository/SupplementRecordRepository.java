package com.parking.repository;

import com.parking.entity.SupplementRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SupplementRecordRepository extends JpaRepository<SupplementRecord, Long> {

    List<SupplementRecord> findByRemoteReleaseIdOrderByCreatedAtDesc(Long remoteReleaseId);

    List<SupplementRecord> findByGateFaultIdOrderByCreatedAtDesc(Long gateFaultId);

    @Query("SELECT sr FROM SupplementRecord sr WHERE " +
            "(:plateNumber IS NULL OR sr.plateNumber = :plateNumber) AND " +
            "(:gateId IS NULL OR sr.gate.id = :gateId) AND " +
            "(:supplementType IS NULL OR sr.supplementType = :supplementType) AND " +
            "(:startTime IS NULL OR sr.createdAt >= :startTime) AND " +
            "(:endTime IS NULL OR sr.createdAt <= :endTime)")
    Page<SupplementRecord> findByFilters(
            @Param("plateNumber") String plateNumber,
            @Param("gateId") Long gateId,
            @Param("supplementType") String supplementType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);
}
