package com.parking.repository;

import com.parking.entity.RemoteRelease;
import com.parking.enums.ReleaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface RemoteReleaseRepository extends JpaRepository<RemoteRelease, Long> {

    Page<RemoteRelease> findByStatus(ReleaseStatus status, Pageable pageable);

    Page<RemoteRelease> findByGateFaultId(Long gateFaultId, Pageable pageable);

    @Query("SELECT rr FROM RemoteRelease rr WHERE " +
            "(:status IS NULL OR rr.status = :status) AND " +
            "(:gateId IS NULL OR rr.gate.id = :gateId) AND " +
            "(:plateNumber IS NULL OR rr.plateNumber = :plateNumber) AND " +
            "(:requestedBy IS NULL OR rr.requestedBy = :requestedBy) AND " +
            "(:startTime IS NULL OR rr.requestedAt >= :startTime) AND " +
            "(:endTime IS NULL OR rr.requestedAt <= :endTime)")
    Page<RemoteRelease> findByFilters(
            @Param("status") ReleaseStatus status,
            @Param("gateId") Long gateId,
            @Param("plateNumber") String plateNumber,
            @Param("requestedBy") String requestedBy,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);
}
