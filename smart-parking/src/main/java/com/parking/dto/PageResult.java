package com.parking.dto;

import lombok.Data;

@Data
public class PageResult<T> {

    private java.util.List<T> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    public static <T> PageResult<T> of(org.springframework.data.domain.Page<T> page) {
        PageResult<T> result = new PageResult<>();
        result.setContent(page.getContent());
        result.setTotalElements(page.getTotalElements());
        result.setTotalPages(page.getTotalPages());
        result.setCurrentPage(page.getNumber());
        result.setPageSize(page.getSize());
        return result;
    }
}
