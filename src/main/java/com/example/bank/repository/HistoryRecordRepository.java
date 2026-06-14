package com.example.bank.repository;

import com.example.bank.entity.HistoryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryRecordRepository extends JpaRepository<HistoryRecord, Long> {

    List<HistoryRecord> findByAppointmentIdOrderByCreatedAtDesc(Long appointmentId);

    List<HistoryRecord> findByAppointmentId(Long appointmentId);
}