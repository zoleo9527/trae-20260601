package com.parking.service;

import com.parking.dto.PageResult;
import com.parking.entity.SupplementRecord;
import com.parking.repository.SupplementRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplementRecordService {

    private final SupplementRecordRepository supplementRecordRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public PageResult<SupplementRecord> querySupplementRecords(String plateNumber, Long gateId,
                                                               String supplementType, String startTime,
                                                               String endTime, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        Page<SupplementRecord> pageResult = supplementRecordRepository.findByFilters(
                plateNumber, gateId, supplementType, start, end, pageRequest);
        return PageResult.of(pageResult);
    }

    public List<SupplementRecord> getByReleaseId(Long releaseId) {
        return supplementRecordRepository.findByRemoteReleaseIdOrderByCreatedAtDesc(releaseId);
    }

    public List<SupplementRecord> getByFaultId(Long faultId) {
        return supplementRecordRepository.findByGateFaultIdOrderByCreatedAtDesc(faultId);
    }

    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.isBlank()) return null;
        return LocalDateTime.parse(str, FMT);
    }
}
