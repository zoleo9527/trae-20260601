package com.medical.aesthetic.dto;

import lombok.Data;

@Data
public class MaterialReservationDTO {
    private Long customerProjectId;
    private Long materialId;
    private Integer quantity;
    private String remark;
}
