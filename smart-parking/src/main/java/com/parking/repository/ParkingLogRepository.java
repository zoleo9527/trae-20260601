package com.parking.repository;

import com.parking.entity.ParkingLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ParkingLogRepository extends JpaRepository<ParkingLog, Long> {

    @Query("SELECT pl FROM ParkingLog pl WHERE " +
            "(:gateId IS NULL OR pl.gate.id = :gateId) AND " +
            "(:plateNumber IS NULL OR pl.plateNumber = :plateNumber) AND " +
            "(:eventType IS NULL OR pl.eventType = :eventType) AND " +
            "(:startTime IS NULL OR pl.eventTime >= :startTime) AND " +
            "(:endTime IS NULL OR pl.eventTime <= :endTime)")
    Page<ParkingLog> findByFilters(
            @Param("gateId") Long gateId,
            @Param("plateNumber") String plateNumber,
            @Param("eventType") String eventType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);
}
