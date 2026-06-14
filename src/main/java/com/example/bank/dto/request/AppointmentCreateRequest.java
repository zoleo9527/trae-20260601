package com.example.bank.dto.request;

import com.example.bank.enums.BusinessType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentCreateRequest {

    @NotBlank(message = "客户姓名不能为空")
    private String customerName;

    @NotBlank(message = "客户身份证号不能为空")
    private String customerId;

    @NotBlank(message = "客户手机号不能为空")
    private String customerPhone;

    @NotNull(message = "业务类型不能为空")
    private BusinessType businessType;

    @NotNull(message = "预约时间不能为空")
    private LocalDateTime appointmentTime;

    private Integer urgentLevel;

    private String remarks;
}