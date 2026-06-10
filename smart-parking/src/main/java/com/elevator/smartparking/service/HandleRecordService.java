package com.elevator.smartparking.service;

import com.elevator.smartparking.entity.HandleRecord;
import com.elevator.smartparking.entity.RecordType;
import com.elevator.smartparking.repository.HandleRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HandleRecordService {

    private final HandleRecordRepository handleRecordRepository;

    @Transactional
    public HandleRecord addRecord(RecordType recordType, Long recordId, String action,
                                  String fromStatus, String toStatus, String content,
                                  Long operatorId, String operatorName) {
        HandleRecord record = new HandleRecord();
        record.setRecordType(recordType);
        record.setRecordId(recordId);
        record.setAction(action);
        record.setFromStatus(fromStatus);
        record.setToStatus(toStatus);
        record.setContent(content);
        record.setOperatorId(operatorId);
        record.setOperatorName(operatorName);
        return handleRecordRepository.save(record);
    }

    public List<HandleRecord> getRecords(RecordType recordType, Long recordId) {
        return handleRecordRepository.findByRecordTypeAndRecordIdOrderByOperateTimeAsc(recordType, recordId);
    }
}
