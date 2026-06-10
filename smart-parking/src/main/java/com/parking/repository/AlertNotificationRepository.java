package com.parking.repository;

import com.parking.entity.AlertNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AlertNotificationRepository extends JpaRepository<AlertNotification, Long> {

    Page<AlertNotification> findByAcknowledgedFalse(Pageable pageable);

    @Query("SELECT an FROM AlertNotification an WHERE " +
            "(:acknowledged IS NULL OR an.acknowledged = :acknowledged) AND " +
            "(:alertType IS NULL OR an.alertType = :alertType)")
    Page<AlertNotification> findByFilters(
            @Param("acknowledged") Boolean acknowledged,
            @Param("alertType") String alertType,
            Pageable pageable);
}
