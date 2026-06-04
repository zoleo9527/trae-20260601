package com.eyeclinic.surgerycenter.exception;

import com.eyeclinic.surgerycenter.enums.ErrorCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final String code;
    private final String message;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.code = errorCode.getCode();
        this.message = errorCode.getMessage();
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.code = errorCode.getCode();
        this.message = message;
    }
}
