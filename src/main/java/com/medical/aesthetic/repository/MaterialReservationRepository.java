package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.MaterialReservation;
import com.medical.aesthetic.enums.MaterialStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaterialReservationRepository extends JpaRepository<MaterialReservation, Long> {

    List<MaterialReservation> findByCustomerProjectId(Long customerProjectId);

    List<MaterialReservation> findByMaterialId(Long materialId);

    List<MaterialReservation> findByStatus(MaterialStatus status);

    @Query("SELECT mr FROM MaterialReservation mr WHERE mr.customerProject.id = :projectId AND mr.status = 'RESERVED'")
    List<MaterialReservation> findActiveReservationsByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT mr FROM MaterialReservation mr WHERE mr.reservedAt BETWEEN :start AND :end ORDER BY mr.reservedAt DESC")
    List<MaterialReservation> findReservationsByDateRange(@Param("start") LocalDateTime start,
                                                          @Param("end") LocalDateTime end);
}
