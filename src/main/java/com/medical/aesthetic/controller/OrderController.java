package com.medical.aesthetic.controller;

import com.medical.aesthetic.common.ApiResponse;
import com.medical.aesthetic.dto.PaymentRecordDTO;
import com.medical.aesthetic.entity.InstallmentPlan;
import com.medical.aesthetic.entity.Order;
import com.medical.aesthetic.enums.PaymentStatus;
import com.medical.aesthetic.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/project/{projectId}")
    public ApiResponse<Order> getByProjectId(@PathVariable Long projectId) {
        return ApiResponse.success(orderService.getByProjectId(projectId));
    }

    @GetMapping("/{orderId}/installments")
    public ApiResponse<List<InstallmentPlan>> getInstallmentPlans(@PathVariable Long orderId) {
        return ApiResponse.success(orderService.getInstallmentPlans(orderId));
    }

    @GetMapping("/overdue")
    public ApiResponse<List<Order>> getOverdueOrders() {
        return ApiResponse.success(orderService.getOverdueOrders());
    }

    @GetMapping("/installment")
    public ApiResponse<List<Order>> getInstallmentOrders() {
        return ApiResponse.success(orderService.getInstallmentOrders());
    }

    @PostMapping
    public ApiResponse<Order> create(@RequestBody Order order) {
        return ApiResponse.success("订单创建成功", orderService.createOrder(order));
    }

    @PostMapping("/payment")
    public ApiResponse<InstallmentPlan> recordPayment(@RequestBody PaymentRecordDTO dto) {
        return ApiResponse.success("还款记录成功", orderService.recordPayment(dto));
    }

    @PutMapping("/{orderId}/status")
    public ApiResponse<Order> updateStatus(@PathVariable Long orderId,
                                           @RequestParam String status,
                                           @RequestParam(required = false) String remark) {
        return ApiResponse.success("状态已更新",
                orderService.updateOrderStatus(orderId, PaymentStatus.valueOf(status), remark));
    }

    @PostMapping("/check-overdue")
    public ApiResponse<Void> checkOverdue() {
        orderService.checkOverduePayments();
        return ApiResponse.success("逾期检查完成", null);
    }
}
