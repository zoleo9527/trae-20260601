package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.InstallmentPlan;
import com.medical.aesthetic.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InstallmentPlanRepository extends JpaRepository<InstallmentPlan, Long> {

    List<InstallmentPlan> findByOrderId(Long orderId);

    List<InstallmentPlan> findByStatus(PaymentStatus status);

    List<InstallmentPlan> findByDueDateBeforeAndStatus(LocalDate date, PaymentStatus status);

    @Query("SELECT ip FROM InstallmentPlan ip WHERE ip.order.id = :orderId ORDER BY ip.period")
    List<InstallmentPlan> findByOrderIdOrdered(@Param("orderId") Long orderId);
}
