package com.parking.repository;

import com.parking.entity.MonthlyRental;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MonthlyRentalRepository extends JpaRepository<MonthlyRental, Long> {

    Optional<MonthlyRental> findByPlateNumberAndParkingLotIdAndActiveTrue(String plateNumber, Long parkingLotId);

    @Query("SELECT mr FROM MonthlyRental mr WHERE " +
            "(:plateNumber IS NULL OR mr.plateNumber = :plateNumber) AND " +
            "(:parkingLotId IS NULL OR mr.parkingLotId = :parkingLotId) AND " +
            "(:active IS NULL OR mr.active = :active)")
    Page<MonthlyRental> findByFilters(
            @Param("plateNumber") String plateNumber,
            @Param("parkingLotId") Long parkingLotId,
            @Param("active") Boolean active,
            Pageable pageable);
}
