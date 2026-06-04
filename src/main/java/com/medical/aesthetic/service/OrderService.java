package com.medical.aesthetic.service;

import com.medical.aesthetic.common.ResultCode;
import com.medical.aesthetic.context.UserContext;
import com.medical.aesthetic.dto.PaymentRecordDTO;
import com.medical.aesthetic.entity.InstallmentPlan;
import com.medical.aesthetic.entity.Order;
import com.medical.aesthetic.enums.PaymentStatus;
import com.medical.aesthetic.enums.RoleType;
import com.medical.aesthetic.exception.BusinessException;
import com.medical.aesthetic.repository.InstallmentPlanRepository;
import com.medical.aesthetic.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final InstallmentPlanRepository installmentPlanRepository;
    private final HistoryNoteService historyNoteService;

    @Transactional(readOnly = true)
    public Order getByProjectId(Long projectId) {
        return orderRepository.findByCustomerProjectId(projectId).stream().findFirst().orElse(null);
    }

    @Transactional(readOnly = true)
    public List<InstallmentPlan> getInstallmentPlans(Long orderId) {
        return installmentPlanRepository.findByOrderIdOrdered(orderId);
    }

    @Transactional(readOnly = true)
    public List<Order> getOverdueOrders() {
        return orderRepository.findOverdueOrders();
    }

    @Transactional(readOnly = true)
    public List<Order> getInstallmentOrders() {
        return orderRepository.findInstallmentOrders();
    }

    @Transactional
    public List<InstallmentPlan> createInstallmentPlan(Order order) {
        if (!order.getInstallment() || order.getInstallmentMonths() == null || order.getInstallmentMonths() <= 0) {
            return new ArrayList<>();
        }

        List<InstallmentPlan> plans = new ArrayList<>();
        BigDecimal totalAmount = order.getTotalAmount();
        BigDecimal deposit = order.getDepositAmount() != null ? order.getDepositAmount() : BigDecimal.ZERO;
        BigDecimal remainingAmount = totalAmount.subtract(deposit);
        int months = order.getInstallmentMonths();
        BigDecimal rate = order.getInstallmentRate() != null ? order.getInstallmentRate() : BigDecimal.ZERO;

        BigDecimal monthlyPrincipal = remainingAmount.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
        BigDecimal totalInterest = remainingAmount.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal monthlyInterest = totalInterest.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);

        LocalDate dueDate = LocalDate.now().plusMonths(1);

        for (int i = 1; i <= months; i++) {
            BigDecimal principal = i == months ? remainingAmount.subtract(monthlyPrincipal.multiply(BigDecimal.valueOf(months - 1))) : monthlyPrincipal;
            BigDecimal interest = i == months ? totalInterest.subtract(monthlyInterest.multiply(BigDecimal.valueOf(months - 1))) : monthlyInterest;

            InstallmentPlan plan = InstallmentPlan.builder()
                    .order(order)
                    .period(i)
                    .dueDate(dueDate.plusMonths(i - 1))
                    .principalAmount(principal)
                    .interestAmount(interest)
                    .totalAmount(principal.add(interest))
                    .paidAmount(BigDecimal.ZERO)
                    .status(PaymentStatus.UNPAID)
                    .build();

            plans.add(installmentPlanRepository.save(plan));
        }

        return plans;
    }

    @Transactional
    public InstallmentPlan recordPayment(PaymentRecordDTO dto) {
        if (!UserContext.hasRole(RoleType.CUSTOMER_SERVICE) && !UserContext.hasRole(RoleType.CONSULTANT)) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }

        InstallmentPlan plan = installmentPlanRepository.findById(dto.getInstallmentPlanId())
                .orElseThrow(() -> new IllegalArgumentException("分期计划不存在: " + dto.getInstallmentPlanId()));

        if (plan.getStatus() == PaymentStatus.FULL_PAID) {
            throw new BusinessException(ResultCode.INVALID_OPERATION, "该期款项已付清");
        }

        BigDecimal oldPaid = plan.getPaidAmount() != null ? plan.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal newPaid = oldPaid.add(dto.getPaidAmount());

        if (newPaid.compareTo(plan.getTotalAmount()) >= 0) {
            plan.setPaidAmount(plan.getTotalAmount());
            plan.setPaidDate(dto.getPaidDate() != null ? dto.getPaidDate() : LocalDate.now());
            plan.setStatus(PaymentStatus.FULL_PAID);
        } else {
            plan.setPaidAmount(newPaid);
            plan.setStatus(PaymentStatus.INSTALLMENT_PAID);
            if (dto.getPaidDate() != null) {
                plan.setPaidDate(dto.getPaidDate());
            }
        }

        if (dto.getRemark() != null) {
            plan.setRemark(dto.getRemark());
        }

        InstallmentPlan saved = installmentPlanRepository.save(plan);

        updateOrderPaymentStatus(plan.getOrder());

        String paymentInfo = String.format("第%d期还款 %s 元，累计已还 %s 元",
                plan.getPeriod(), dto.getPaidAmount(), saved.getPaidAmount());
        historyNoteService.addPaymentNote(plan.getOrder().getCustomerProject().getId(), paymentInfo);

        log.info("款项记录成功 - 订单: {}, 期数: {}, 金额: {}",
                plan.getOrder().getOrderNo(), plan.getPeriod(), dto.getPaidAmount());

        return saved;
    }

    @Transactional
    public void updateOrderPaymentStatus(Order order) {
        List<InstallmentPlan> plans = installmentPlanRepository.findByOrderIdOrdered(order.getId());

        BigDecimal deposit = order.getDepositAmount() != null ? order.getDepositAmount() : BigDecimal.ZERO;

        if (plans.isEmpty()) {
            if (deposit.compareTo(BigDecimal.ZERO) > 0) {
                order.setPaidAmount(deposit);
                order.setRemainingAmount(order.getTotalAmount().subtract(deposit));
                if (deposit.compareTo(order.getTotalAmount()) >= 0) {
                    order.setPaymentStatus(PaymentStatus.FULL_PAID);
                } else {
                    order.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
                }
            }
            orderRepository.save(order);
            return;
        }

        boolean allPaid = plans.stream().allMatch(p -> p.getStatus() == PaymentStatus.FULL_PAID);
        boolean anyOverdue = plans.stream().anyMatch(p ->
                p.getStatus() != PaymentStatus.FULL_PAID && p.getDueDate().isBefore(LocalDate.now()));
        boolean anyInstallmentPaid = plans.stream().anyMatch(p -> p.getPaidAmount() != null && p.getPaidAmount().compareTo(BigDecimal.ZERO) > 0);

        BigDecimal installmentPaid = plans.stream()
                .map(p -> p.getPaidAmount() != null ? p.getPaidAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = deposit.add(installmentPaid);
        order.setPaidAmount(totalPaid);
        order.setRemainingAmount(order.getTotalAmount().subtract(totalPaid));

        if (allPaid && totalPaid.compareTo(order.getTotalAmount()) >= 0) {
            order.setPaymentStatus(PaymentStatus.FULL_PAID);
        } else if (anyOverdue) {
            order.setPaymentStatus(PaymentStatus.OVERDUE);
        } else if (anyInstallmentPaid) {
            order.setPaymentStatus(PaymentStatus.INSTALLMENT_PAID);
        } else if (deposit.compareTo(BigDecimal.ZERO) > 0) {
            order.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
        } else {
            order.setPaymentStatus(PaymentStatus.UNPAID);
        }

        orderRepository.save(order);
    }

    @Transactional
    public Order createOrder(Order order) {
        if (order.getOrderNo() == null || order.getOrderNo().isEmpty()) {
            order.setOrderNo("ORD" + System.currentTimeMillis());
        }
        BigDecimal deposit = order.getDepositAmount() != null ? order.getDepositAmount() : BigDecimal.ZERO;
        if (order.getPaidAmount() == null) {
            order.setPaidAmount(deposit);
        }
        if (order.getRemainingAmount() == null) {
            order.setRemainingAmount(order.getTotalAmount().subtract(order.getPaidAmount()));
        }
        if (order.getPaymentStatus() == null) {
            if (deposit.compareTo(BigDecimal.ZERO) > 0) {
                order.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
            } else {
                order.setPaymentStatus(PaymentStatus.UNPAID);
            }
        }
        Order saved = orderRepository.save(order);

        if (Boolean.TRUE.equals(order.getInstallment())) {
            createInstallmentPlan(saved);
        }

        return saved;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, PaymentStatus status, String remark) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("订单不存在: " + orderId));

        PaymentStatus oldStatus = order.getPaymentStatus();
        order.setPaymentStatus(status);
        if (remark != null) {
            order.setRemark(remark);
        }

        Order saved = orderRepository.save(order);

        String statusInfo = String.format("订单状态从 [%s] 变更为 [%s]，备注：%s",
                oldStatus.getDisplayName(), status.getDisplayName(), remark);
        historyNoteService.addPaymentNote(order.getCustomerProject().getId(), statusInfo);

        return saved;
    }

    @Transactional
    public void checkOverduePayments() {
        List<InstallmentPlan> overduePlans = installmentPlanRepository
                .findByDueDateBeforeAndStatus(LocalDate.now(), PaymentStatus.UNPAID);

        overduePlans.forEach(plan -> {
            if (plan.getStatus() == PaymentStatus.UNPAID || plan.getStatus() == PaymentStatus.INSTALLMENT_PAID) {
                plan.setStatus(PaymentStatus.OVERDUE);
                installmentPlanRepository.save(plan);
                updateOrderPaymentStatus(plan.getOrder());

                String warning = String.format("第%d期款项已逾期，应还日期：%s，应还金额：%s",
                        plan.getPeriod(), plan.getDueDate(), plan.getTotalAmount());
                historyNoteService.addPaymentNote(plan.getOrder().getCustomerProject().getId(), warning);
            }
        });
    }
}
