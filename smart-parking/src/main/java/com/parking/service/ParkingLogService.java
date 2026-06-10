package com.parking.service;

import com.parking.dto.PageResult;
import com.parking.dto.ParkingLogVO;
import com.parking.entity.ParkingLog;
import com.parking.repository.ParkingLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ParkingLogService {

    private final ParkingLogRepository parkingLogRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public PageResult<ParkingLogVO> queryLogs(Long gateId, String plateNumber, String eventType,
                                               String startTime, String endTime, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "eventTime"));
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        Page<ParkingLog> pageResult = parkingLogRepository.findByFilters(
                gateId, plateNumber, eventType, start, end, pageRequest);

        Page<ParkingLogVO> voPage = pageResult.map(ParkingLogVO::fromEntity);
        return PageResult.of(voPage);
    }

    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.isBlank()) return null;
        return LocalDateTime.parse(str, FMT);
    }
}
