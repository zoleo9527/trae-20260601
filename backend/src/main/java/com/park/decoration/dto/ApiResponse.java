package com.park.decoration.dto;

import lombok.Data;

@Data
public class ApiResponse<T> {

    private int code;
    private String message;
    private T data;
    private boolean idempotentHit;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(200);
        response.setMessage("success");
        response.setData(data);
        return response;
    }

    public static <T> ApiResponse<T> success(T data, boolean idempotentHit) {
        ApiResponse<T> response = success(data);
        response.setIdempotentHit(idempotentHit);
        return response;
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        return response;
    }
}
