package com.elevator.maintenance.service;

import com.elevator.maintenance.dto.NoteRequest;
import com.elevator.maintenance.dto.PlanDispatchRequest;
import com.elevator.maintenance.dto.PlanReviewRequest;
import com.elevator.maintenance.dto.BatchReviewRequest;
import com.elevator.maintenance.entity.Elevator;
import com.elevator.maintenance.entity.MaintenanceNote;
import com.elevator.maintenance.entity.MaintenancePlan;
import com.elevator.maintenance.entity.User;
import com.elevator.maintenance.repository.ElevatorRepository;
import com.elevator.maintenance.repository.MaintenanceNoteRepository;
import com.elevator.maintenance.repository.MaintenancePlanRepository;
import com.elevator.maintenance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class MaintenancePlanService {
    @Autowired
    private MaintenancePlanRepository planRepository;
    @Autowired
    private MaintenanceNoteRepository noteRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ElevatorRepository elevatorRepository;

    public List<MaintenancePlan> findAll() {
        List<MaintenancePlan> plans = planRepository.findAll();
        return populateTransientFields(plans);
    }

    public MaintenancePlan findById(Long id) {
        MaintenancePlan plan = planRepository.findById(id).orElse(null);
        if (plan != null) {
            populateTransientFields(plan);
        }
        return plan;
    }

    public List<MaintenancePlan> findByStatus(String status) {
        List<MaintenancePlan> plans = planRepository.findByStatus(status);
        return populateTransientFields(plans);
    }

    public List<MaintenancePlan> findByTechnicianId(Long technicianId) {
        List<MaintenancePlan> plans = planRepository.findByTechnicianId(technicianId);
        return populateTransientFields(plans);
    }

    public List<MaintenancePlan> findByTechnicianIdAndStatus(Long technicianId, String status) {
        List<MaintenancePlan> plans = planRepository.findByTechnicianIdAndStatus(technicianId, status);
        return populateTransientFields(plans);
    }

    @Transactional
    public MaintenancePlan create(MaintenancePlan plan) {
        plan.setStatus("PENDING");
        plan.setPlanNo("MP" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        return planRepository.save(plan);
    }

    @Transactional
    public MaintenancePlan dispatch(PlanDispatchRequest request) {
        MaintenancePlan plan = planRepository.findById(request.getPlanId()).orElse(null);
        if (plan == null) {
            return null;
        }
        plan.setTechnicianId(request.getTechnicianId());
        plan.setDispatcherId(request.getDispatcherId());
        plan.setStatus("DISPATCHED");
        planRepository.save(plan);

        if (request.getRemark() != null && !request.getRemark().isEmpty()) {
            MaintenanceNote note = new MaintenanceNote();
            note.setPlanId(plan.getId());
            note.setOperatorId(request.getDispatcherId());
            note.setContent(request.getRemark());
            note.setAction("DISPATCH");
            noteRepository.save(note);
        }

        return plan;
    }

    @Transactional
    public MaintenancePlan review(PlanReviewRequest request) {
        MaintenancePlan plan = planRepository.findById(request.getPlanId()).orElse(null);
        if (plan == null) {
            return null;
        }
        plan.setSupervisorId(request.getSupervisorId());
        plan.setReviewRemark(request.getReviewRemark());
        plan.setStatus(request.getStatus());
        planRepository.save(plan);

        MaintenanceNote note = new MaintenanceNote();
        note.setPlanId(plan.getId());
        note.setOperatorId(request.getSupervisorId());
        note.setContent(request.getReviewRemark());
        note.setAction(request.getStatus());
        noteRepository.save(note);

        return plan;
    }

    @Transactional
    public List<MaintenancePlan> batchReview(BatchReviewRequest request) {
        List<MaintenancePlan> updatedPlans = new ArrayList<>();
        for (Long planId : request.getPlanIds()) {
            MaintenancePlan plan = planRepository.findById(planId).orElse(null);
            if (plan != null) {
                plan.setSupervisorId(request.getSupervisorId());
                plan.setReviewRemark(request.getReviewRemark());
                plan.setStatus(request.getStatus());
                planRepository.save(plan);

                MaintenanceNote note = new MaintenanceNote();
                note.setPlanId(plan.getId());
                note.setOperatorId(request.getSupervisorId());
                note.setContent(request.getReviewRemark());
                note.setAction(request.getStatus());
                noteRepository.save(note);

                updatedPlans.add(plan);
            }
        }
        return populateTransientFields(updatedPlans);
    }

    @Transactional
    public MaintenanceNote addNote(NoteRequest request) {
        MaintenanceNote note = new MaintenanceNote();
        note.setPlanId(request.getPlanId());
        note.setOperatorId(request.getOperatorId());
        note.setContent(request.getContent());
        note.setAction(request.getAction());
        return noteRepository.save(note);
    }

    public List<MaintenanceNote> getNotes(Long planId) {
        List<MaintenanceNote> notes = noteRepository.findByPlanIdOrderByCreateTimeDesc(planId);
        for (MaintenanceNote note : notes) {
            User user = userRepository.findById(note.getOperatorId()).orElse(null);
            if (user != null) {
                note.setOperatorName(user.getRealName());
            }
        }
        return notes;
    }

    public MaintenancePlan save(MaintenancePlan plan) {
        return planRepository.save(plan);
    }

    public void deleteById(Long id) {
        planRepository.deleteById(id);
    }

    private List<MaintenancePlan> populateTransientFields(List<MaintenancePlan> plans) {
        for (MaintenancePlan plan : plans) {
            populateTransientFields(plan);
        }
        return plans;
    }

    private void populateTransientFields(MaintenancePlan plan) {
        Elevator elevator = elevatorRepository.findById(plan.getElevatorId()).orElse(null);
        if (elevator != null) {
            plan.setElevatorNo(elevator.getElevatorNo());
            plan.setProjectName(elevator.getProjectName());
            plan.setAddress(elevator.getAddress());
        }
        if (plan.getTechnicianId() != null) {
            User tech = userRepository.findById(plan.getTechnicianId()).orElse(null);
            if (tech != null) {
                plan.setTechnicianName(tech.getRealName());
            }
        }
        if (plan.getDispatcherId() != null) {
            User dispatcher = userRepository.findById(plan.getDispatcherId()).orElse(null);
            if (dispatcher != null) {
                plan.setDispatcherName(dispatcher.getRealName());
            }
        }
        if (plan.getSupervisorId() != null) {
            User supervisor = userRepository.findById(plan.getSupervisorId()).orElse(null);
            if (supervisor != null) {
                plan.setSupervisorName(supervisor.getRealName());
            }
        }
    }
}
