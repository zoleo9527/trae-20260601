package com.example.recruitment.service;

import com.example.recruitment.dto.response.PositionResponse;
import com.example.recruitment.entity.Position;
import com.example.recruitment.enums.PositionStatusEnum;
import com.example.recruitment.mapper.PositionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PositionService {

    private final PositionMapper positionMapper;

    public List<PositionResponse> getExpiredPositions() {
        List<Position> positions = positionMapper.selectExpiredPositions();
        return positions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<PositionResponse> getExpiringSoonPositions(Integer days) {
        if (days == null) {
            days = 7;
        }
        List<Position> positions = positionMapper.selectExpiringSoonPositions(days);
        return positions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    private PositionResponse convertToResponse(Position position) {
        LocalDateTime now = LocalDateTime.now();
        boolean isExpired = position.getExpireTime() != null && position.getExpireTime().isBefore(now);
        
        Integer displayStatus = isExpired ? PositionStatusEnum.EXPIRED.getCode() : position.getStatus();
        String statusDesc = PositionStatusEnum.fromCode(displayStatus) != null ?
                PositionStatusEnum.fromCode(displayStatus).getDesc() : null;

        return PositionResponse.builder()
                .id(position.getId())
                .positionName(position.getPositionName())
                .companyId(position.getCompanyId())
                .companyName(position.getCompanyName())
                .department(position.getDepartment())
                .workLocation(position.getWorkLocation())
                .salaryMin(position.getSalaryMin())
                .salaryMax(position.getSalaryMax())
                .salaryType(position.getSalaryType())
                .salaryTypeDesc(position.getSalaryType() != null ?
                        (position.getSalaryType() == 1 ? "月薪" : position.getSalaryType() == 2 ? "日薪" : "时薪") : null)
                .requirement(position.getRequirement())
                .benefits(position.getBenefits())
                .rebateAmount(position.getRebateAmount())
                .rebateCondition(position.getRebateCondition())
                .status(displayStatus)
                .statusDesc(statusDesc)
                .originalStatus(position.getStatus())
                .isExpired(isExpired)
                .expireTime(position.getExpireTime())
                .createdAt(position.getCreatedAt())
                .build();
    }
}
