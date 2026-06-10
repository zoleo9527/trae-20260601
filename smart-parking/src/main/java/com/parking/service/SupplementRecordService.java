package com.parking.service;

import com.parking.dto.PageResult;
import com.parking.dto.SupplementRecordVO;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplementRecordService {

    private final SupplementRecordRepository supplementRecordRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public PageResult<SupplementRecordVO> querySupplementRecords(String plateNumber, Long gateId,
                                                                  String supplementType, String startTime,
                                                                  String endTime, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        Page<SupplementRecord> pageResult = supplementRecordRepository.findByFilters(
                plateNumber, gateId, supplementType, start, end, pageRequest);

        Page<SupplementRecordVO> voPage = pageResult.map(SupplementRecordVO::fromEntity);
        return PageResult.of(voPage);
    }

    public List<SupplementRecordVO> getByReleaseId(Long releaseId) {
        return supplementRecordRepository.findByRemoteReleaseIdOrderByCreatedAtDesc(releaseId).stream()
                .map(SupplementRecordVO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SupplementRecordVO> getByFaultId(Long faultId) {
        return supplementRecordRepository.findByGateFaultIdOrderByCreatedAtDesc(faultId).stream()
                .map(SupplementRecordVO::fromEntity)
                .collect(Collectors.toList());
    }

    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.isBlank()) return null;
        return LocalDateTime.parse(str, FMT);
    }
}
