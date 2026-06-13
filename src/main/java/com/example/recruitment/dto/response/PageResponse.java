
package com.example.recruitment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> list;

    private Long total;

    private Integer pageNum;

    private Integer pageSize;

    public static <T> PageResponse<T> of(List<T> list, Long total, Integer pageNum, Integer pageSize) {
        return PageResponse.<T>builder()
                .list(list)
                .total(total)
                .pageNum(pageNum)
                .pageSize(pageSize)
                .build();
    }
}
