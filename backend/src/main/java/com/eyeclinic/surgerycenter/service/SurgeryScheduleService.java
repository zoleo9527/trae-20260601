package com.eyeclinic.surgerycenter.service;

import com.eyeclinic.surgerycenter.dto.WorkflowDTO;
import com.eyeclinic.surgerycenter.dto.WorkflowVO;
import com.eyeclinic.surgerycenter.entity.SurgerySchedule;
import com.eyeclinic.surgerycenter.entity.User;
import com.eyeclinic.surgerycenter.entity.WorkflowInstance;
import com.eyeclinic.surgerycenter.enums.ErrorCode;
import com.eyeclinic.surgerycenter.enums.RoleType;
import com.eyeclinic.surgerycenter.exception.BusinessException;
import com.eyeclinic.surgerycenter.repository.SurgeryScheduleRepository;
import com.eyeclinic.surgerycenter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SurgeryScheduleService {

    private final SurgeryScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional
    public SurgerySchedule createSchedule(WorkflowInstance workflow, WorkflowDTO.ScheduleRequest request) {
        User handler = userRepository.findById(request.getHandlerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "处理人不存在"));

        if (handler.getRole() != RoleType.RECEPTIONIST) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED, "只有接待人员可以安排手术");
        }

        LocalDate surgeryDate = LocalDate.parse(request.getSurgeryDate(), dateFormatter);
        LocalTime startTime = LocalTime.parse(request.getStartTime(), timeFormatter);
        LocalTime endTime = startTime.plusMinutes(workflow.getSurgeryType().getDurationMinutes());

        validateScheduleConflict(surgeryDate, request.getOperatingRoom(), startTime, endTime, null);

        SurgerySchedule schedule = new SurgerySchedule();
        schedule.setWorkflow(workflow);
        schedule.setSurgeryDate(surgeryDate);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setSurgeryType(workflow.getSurgeryType());
        schedule.setOperatingRoom(request.getOperatingRoom());
        schedule.setScheduledBy(handler);
        schedule.setMaterialList(request.getMaterialList());
        schedule.setRemarks(request.getRemarks());
        schedule.setConfirmed(false);

        if (request.getSurgeonId() != null) {
            User surgeon = userRepository.findById(request.getSurgeonId()).orElse(null);
            schedule.setSurgeon(surgeon);
        }
        if (request.getAnesthesiologistId() != null) {
            User anesthesiologist = userRepository.findById(request.getAnesthesiologistId()).orElse(null);
            schedule.setAnesthesiologist(anesthesiologist);
        }

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public SurgerySchedule updateSchedule(WorkflowInstance workflow, WorkflowDTO.ScheduleRequest request) {
        SurgerySchedule schedule = scheduleRepository.findByWorkflow(workflow)
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "排期不存在"));

        LocalDate surgeryDate = LocalDate.parse(request.getSurgeryDate(), dateFormatter);
        LocalTime startTime = LocalTime.parse(request.getStartTime(), timeFormatter);
        LocalTime endTime = startTime.plusMinutes(workflow.getSurgeryType().getDurationMinutes());

        validateScheduleConflict(surgeryDate, request.getOperatingRoom(), startTime, endTime, schedule.getId());

        schedule.setSurgeryDate(surgeryDate);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setOperatingRoom(request.getOperatingRoom());
        schedule.setMaterialList(request.getMaterialList());
        schedule.setRemarks(request.getRemarks());

        if (request.getSurgeonId() != null) {
            User surgeon = userRepository.findById(request.getSurgeonId()).orElse(null);
            schedule.setSurgeon(surgeon);
        }
        if (request.getAnesthesiologistId() != null) {
            User anesthesiologist = userRepository.findById(request.getAnesthesiologistId()).orElse(null);
            schedule.setAnesthesiologist(anesthesiologist);
        }

        return scheduleRepository.save(schedule);
    }

    private void validateScheduleConflict(LocalDate date, String room, LocalTime start, LocalTime end, Long excludeId) {
        List<SurgerySchedule> conflicts = scheduleRepository.findConflictingSchedules(date, room, start, end);
        if (excludeId != null) {
            conflicts = conflicts.stream().filter(s -> !s.getId().equals(excludeId)).toList();
        }
        if (!conflicts.isEmpty()) {
            SurgerySchedule conflict = conflicts.get(0);
            String conflictType = conflict.getConfirmed() ? "已确认" : "待审";
            String patientName = conflict.getWorkflow() != null && conflict.getWorkflow().getPatient() != null
                    ? conflict.getWorkflow().getPatient().getName() : "未知";
            throw new BusinessException(ErrorCode.SCHEDULE_TIME_CONFLICT,
                    String.format("手术室%s在%s %s-%s已有%s安排（患者：%s）",
                            room, date, start, end, conflictType, patientName));
        }
    }

    public Optional<SurgerySchedule> getSchedule(WorkflowInstance workflow) {
        return scheduleRepository.findByWorkflow(workflow);
    }

    @Transactional
    public SurgerySchedule confirmSchedule(SurgerySchedule schedule, User reviewer, boolean approved, String reason) {
        if (reviewer.getRole() != RoleType.SUPERVISOR) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED, "只有审核主管可以确认排期");
        }

        if (approved) {
            validateScheduleConflict(
                    schedule.getSurgeryDate(),
                    schedule.getOperatingRoom(),
                    schedule.getStartTime(),
                    schedule.getEndTime(),
                    schedule.getId()
            );
            schedule.setConfirmed(true);
            schedule.setConfirmedAt(LocalDateTime.now());
            schedule.setConfirmedBy(reviewer);
        } else {
            schedule.setRejectionReason(reason);
        }

        return scheduleRepository.save(schedule);
    }

    public WorkflowVO.ScheduleInfoVO convertToVO(SurgerySchedule schedule) {
        if (schedule == null) return null;

        WorkflowVO.ScheduleInfoVO vo = new WorkflowVO.ScheduleInfoVO();
        vo.setId(schedule.getId());
        vo.setSurgeryDate(schedule.getSurgeryDate().format(dateFormatter));
        vo.setStartTime(schedule.getStartTime().format(timeFormatter));
        vo.setEndTime(schedule.getEndTime() != null ? schedule.getEndTime().format(timeFormatter) : null);
        vo.setOperatingRoom(schedule.getOperatingRoom());
        vo.setSurgeonName(schedule.getSurgeon() != null ? schedule.getSurgeon().getRealName() : null);
        vo.setAnesthesiologistName(schedule.getAnesthesiologist() != null ? schedule.getAnesthesiologist().getRealName() : null);
        vo.setMaterialList(schedule.getMaterialList());
        vo.setRemarks(schedule.getRemarks());
        vo.setConfirmed(schedule.getConfirmed());
        return vo;
    }

    public List<SurgerySchedule> getScheduleByDateRange(LocalDate start, LocalDate end) {
        return scheduleRepository.findByConfirmedTrueAndSurgeryDateBetweenOrderBySurgeryDateAscStartTimeAsc(start, end);
    }
}
