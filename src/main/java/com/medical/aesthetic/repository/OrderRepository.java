package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.Order;
import com.medical.aesthetic.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNo(String orderNo);

    List<Order> findByCustomerProjectId(Long customerProjectId);

    List<Order> findByPaymentStatus(PaymentStatus status);

    @Query("SELECT o FROM Order o WHERE o.installment = true AND o.paymentStatus IN ('INSTALLMENT_PAID', 'OVERDUE')")
    List<Order> findInstallmentOrders();

    @Query("SELECT o FROM Order o WHERE o.paymentStatus = 'OVERDUE'")
    List<Order> findOverdueOrders();

    @Query("SELECT o FROM Order o WHERE o.customerProject.customer.id = :customerId")
    List<Order> findByCustomerId(@Param("customerId") Long customerId);
}
