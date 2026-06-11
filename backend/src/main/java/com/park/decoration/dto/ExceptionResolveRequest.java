package com.park.decoration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExceptionResolveRequest {

    @NotBlank(message = "处置结果不能为空")
    private String resolution;

    @NotBlank(message = "解决人不能为空")
    private String resolvedBy;
}
