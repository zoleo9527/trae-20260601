package com.elevator.maintenance.service;

import com.elevator.maintenance.dto.CheckInRequest;
import com.elevator.maintenance.dto.CheckOutRequest;
import com.elevator.maintenance.entity.CheckInRecord;
import com.elevator.maintenance.entity.Elevator;
import com.elevator.maintenance.entity.MaintenancePlan;
import com.elevator.maintenance.entity.User;
import com.elevator.maintenance.repository.CheckInRecordRepository;
import com.elevator.maintenance.repository.ElevatorRepository;
import com.elevator.maintenance.repository.MaintenancePlanRepository;
import com.elevator.maintenance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CheckInService {
    @Autowired
    private CheckInRecordRepository checkInRepository;
    @Autowired
    private MaintenancePlanRepository planRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ElevatorRepository elevatorRepository;

    public List<CheckInRecord> findAll() {
        List<CheckInRecord> records = checkInRepository.findAll();
        return populateTransientFields(records);
    }

    public CheckInRecord findById(Long id) {
        CheckInRecord record = checkInRepository.findById(id).orElse(null);
        if (record != null) {
            populateTransientFields(record);
        }
        return record;
    }

    public List<CheckInRecord> findByPlanId(Long planId) {
        List<CheckInRecord> records = checkInRepository.findByPlanId(planId);
        return populateTransientFields(records);
    }

    public List<CheckInRecord> findByTechnicianId(Long technicianId) {
        List<CheckInRecord> records = checkInRepository.findByTechnicianId(technicianId);
        return populateTransientFields(records);
    }

    @Transactional
    public CheckInRecord checkIn(CheckInRequest request) {
        Optional<CheckInRecord> existing = checkInRepository.findTopByPlanIdAndCheckOutTimeIsNullOrderByCheckInTimeDesc(request.getPlanId());
        if (existing.isPresent()) {
            return null;
        }

        MaintenancePlan plan = planRepository.findById(request.getPlanId()).orElse(null);
        if (plan == null) {
            return null;
        }

        CheckInRecord record = new CheckInRecord();
        record.setPlanId(request.getPlanId());
        record.setTechnicianId(request.getTechnicianId());
        record.setElevatorId(plan.getElevatorId());
        record.setCheckInTime(LocalDateTime.now());
        record.setLatitude(request.getLatitude());
        record.setLongitude(request.getLongitude());
        record.setLocationRemark(request.getLocationRemark());
        record.setPhotoData(request.getPhotoData());

        checkInRepository.save(record);

        plan.setStatus("IN_PROGRESS");
        planRepository.save(plan);

        return record;
    }

    @Transactional
    public CheckInRecord checkOut(CheckOutRequest request) {
        CheckInRecord record = checkInRepository.findById(request.getRecordId()).orElse(null);
        if (record == null || record.getCheckOutTime() != null) {
            return null;
        }

        record.setCheckOutTime(LocalDateTime.now());
        record.setWorkContent(request.getWorkContent());
        record.setWorkResult(request.getWorkResult());
        record.setProblemDesc(request.getProblemDesc());
        record.setSolution(request.getSolution());
        record.setRemark(request.getRemark());

        checkInRepository.save(record);

        MaintenancePlan plan = planRepository.findById(record.getPlanId()).orElse(null);
        if (plan != null) {
            plan.setStatus("FOR_REVIEW");
            planRepository.save(plan);
        }

        return record;
    }

    public CheckInRecord getCurrentCheckIn(Long planId) {
        Optional<CheckInRecord> record = checkInRepository.findTopByPlanIdAndCheckOutTimeIsNullOrderByCheckInTimeDesc(planId);
        if (record.isPresent()) {
            populateTransientFields(record.get());
            return record.get();
        }
        return null;
    }

    private List<CheckInRecord> populateTransientFields(List<CheckInRecord> records) {
        for (CheckInRecord record : records) {
            populateTransientFields(record);
        }
        return records;
    }

    private void populateTransientFields(CheckInRecord record) {
        User tech = userRepository.findById(record.getTechnicianId()).orElse(null);
        if (tech != null) {
            record.setTechnicianName(tech.getRealName());
        }
        Elevator elevator = elevatorRepository.findById(record.getElevatorId()).orElse(null);
        if (elevator != null) {
            record.setElevatorNo(elevator.getElevatorNo());
            record.setProjectName(elevator.getProjectName());
        }
    }
}
