package com.parking.repository;

import com.parking.entity.GateFault;
import com.parking.enums.FaultStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GateFaultRepository extends JpaRepository<GateFault, Long> {

    Page<GateFault> findByStatus(FaultStatus status, Pageable pageable);

    Page<GateFault> findByGateId(Long gateId, Pageable pageable);

    @Query("SELECT gf FROM GateFault gf WHERE " +
            "(:status IS NULL OR gf.status = :status) AND " +
            "(:gateId IS NULL OR gf.gate.id = :gateId) AND " +
            "(:faultType IS NULL OR gf.faultType = :faultType) AND " +
            "(:reportedBy IS NULL OR gf.reportedBy = :reportedBy) AND " +
            "(:startTime IS NULL OR gf.reportedAt >= :startTime) AND " +
            "(:endTime IS NULL OR gf.reportedAt <= :endTime)")
    Page<GateFault> findByFilters(
            @Param("status") FaultStatus status,
            @Param("gateId") Long gateId,
            @Param("faultType") String faultType,
            @Param("reportedBy") String reportedBy,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    @Query("SELECT COUNT(gf) FROM GateFault gf WHERE gf.gate.id = :gateId AND gf.reportedAt >= :since")
    int countByGateIdSince(@Param("gateId") Long gateId, @Param("since") LocalDateTime since);

    @Query("SELECT gf FROM GateFault gf WHERE gf.status = :status AND gf.reportedAt < :deadline")
    List<GateFault> findOverdueFaults(@Param("status") FaultStatus status, @Param("deadline") LocalDateTime deadline);
}
