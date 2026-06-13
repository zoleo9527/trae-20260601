package com.hrstaffing.service;

import com.hrstaffing.common.PageResult;
import com.hrstaffing.common.auth.Role;
import com.hrstaffing.common.auth.UserContext;
import com.hrstaffing.common.exception.BizException;
import com.hrstaffing.dto.ScheduleCreateDTO;
import com.hrstaffing.dto.ScheduleQueryDTO;
import com.hrstaffing.dto.ScheduleUpdateDTO;
import com.hrstaffing.entity.AttendanceSchedule;
import com.hrstaffing.entity.Employee;
import com.hrstaffing.enums.ScheduleStatus;
import com.hrstaffing.repository.AttendanceScheduleRepository;
import com.hrstaffing.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final AttendanceScheduleRepository scheduleRepo;
    private final EmployeeRepository employeeRepo;
    private final StateMachineService stateMachine;

    @Transactional
    public AttendanceSchedule create(ScheduleCreateDTO dto) {
        Employee emp = employeeRepo.findById(dto.getEmployeeId())
                .orElseThrow(() -> new BizException("员工不存在"));

        UserContext.CurrentUser user = UserContext.getCurrent();
        if (user.getRole() == Role.RECRUITER && !emp.getRecruiterId().equals(user.getUserId())) {
            throw new BizException("仅可对自己名下的员工创建排班");
        }

        scheduleRepo.findByEmployeeIdAndScheduleDate(emp.getId(), dto.getScheduleDate())
                .ifPresent(s -> {
                    throw new BizException("该员工当日已存在排班");
                });

        AttendanceSchedule s = new AttendanceSchedule();
        s.setEmployeeId(emp.getId());
        s.setEmployeeNo(emp.getEmployeeNo());
        s.setEmployeeName(emp.getName());
        s.setScheduleDate(dto.getScheduleDate());
        s.setShiftStart(dto.getShiftStart());
        s.setShiftEnd(dto.getShiftEnd());
        s.setScheduledHours(dto.getScheduledHours());
        s.setActualPunchIn(dto.getActualPunchIn());
        s.setActualPunchOut(dto.getActualPunchOut());
        s.setActualWorkHours(dto.getActualWorkHours());
        s.setOvertimeHours(dto.getOvertimeHours());
        s.setLeaveHours(dto.getLeaveHours());
        s.setScheduleRemark(dto.getScheduleRemark());
        s.setStatus(ScheduleStatus.DRAFT);
        s.setRecruiterId(emp.getRecruiterId());
        s.setRecruiterName(emp.getRecruiterName());
        s.setSupervisorId(emp.getSupervisorId());
        s.setSupervisorName(emp.getSupervisorName());
        return scheduleRepo.save(s);
    }

    @Transactional
    public AttendanceSchedule update(Long id, ScheduleUpdateDTO dto) {
        AttendanceSchedule s = scheduleRepo.findById(id)
                .orElseThrow(() -> new BizException("排班记录不存在"));
        if (s.getStatus() != ScheduleStatus.DRAFT) {
            throw new BizException("仅草稿状态可修改，当前状态: " + s.getStatus().getLabel());
        }
        Long current = UserContext.getCurrent().getUserId();
        if (!s.getRecruiterId().equals(current)) {
            throw new BizException("仅创建此排班的招聘专员可修改");
        }

        if (dto.getShiftStart() != null) s.setShiftStart(dto.getShiftStart());
        if (dto.getShiftEnd() != null) s.setShiftEnd(dto.getShiftEnd());
        if (dto.getScheduledHours() != null) s.setScheduledHours(dto.getScheduledHours());
        if (dto.getActualPunchIn() != null) s.setActualPunchIn(dto.getActualPunchIn());
        if (dto.getActualPunchOut() != null) s.setActualPunchOut(dto.getActualPunchOut());
        if (dto.getActualWorkHours() != null) s.setActualWorkHours(dto.getActualWorkHours());
        if (dto.getOvertimeHours() != null) s.setOvertimeHours(dto.getOvertimeHours());
        if (dto.getLeaveHours() != null) s.setLeaveHours(dto.getLeaveHours());
        if (dto.getScheduleRemark() != null) s.setScheduleRemark(dto.getScheduleRemark());
        return scheduleRepo.save(s);
    }

    @Transactional
    public void delete(Long id) {
        AttendanceSchedule s = scheduleRepo.findById(id)
                .orElseThrow(() -> new BizException("排班记录不存在"));
        if (s.getStatus() != ScheduleStatus.DRAFT) {
            throw new BizException("仅草稿状态可删除");
        }
        Long current = UserContext.getCurrent().getUserId();
        if (!s.getRecruiterId().equals(current)) {
            throw new BizException("仅创建此排班的招聘专员可删除");
        }
        scheduleRepo.delete(s);
    }

    @Transactional
    public AttendanceSchedule submit(Long id) {
        AttendanceSchedule s = scheduleRepo.findById(id)
                .orElseThrow(() -> new BizException("排班记录不存在"));
        Long current = UserContext.getCurrent().getUserId();
        if (!s.getRecruiterId().equals(current)) {
            throw new BizException("仅创建此排班的招聘专员可提交");
        }
        stateMachine.transitionSchedule(s, ScheduleStatus.SUBMITTED, UserContext.getCurrent().getUserName());
        s.setSubmittedAt(LocalDateTime.now());
        return scheduleRepo.save(s);
    }

    public AttendanceSchedule detail(Long id) {
        AttendanceSchedule s = scheduleRepo.findById(id)
                .orElseThrow(() -> new BizException("排班记录不存在"));
        UserContext.CurrentUser user = UserContext.getCurrent();
        if (user.getRole() == Role.RECRUITER && !s.getRecruiterId().equals(user.getUserId())) {
            throw new BizException("无权查看该排班记录");
        }
        if (user.getRole() == Role.SUPERVISOR && !s.getSupervisorId().equals(user.getUserId())) {
            throw new BizException("无权查看该排班记录");
        }
        return s;
    }

    public PageResult<AttendanceSchedule> recruiterPage(ScheduleQueryDTO dto) {
        Long recruiterId = UserContext.getCurrent().getUserId();
        Pageable pageable = PageRequest.of(
                Math.max(dto.getPage() - 1, 0),
                dto.getSize(),
                Sort.by(Sort.Direction.DESC, "scheduleDate", "id")
        );
        Page<AttendanceSchedule> pg = scheduleRepo.searchPage(
                recruiterId, null, dto.getEmployeeId(), dto.getStatus(),
                dto.getStartDate(), dto.getEndDate(), dto.getKeyword(), pageable
        );
        return PageResult.of(pg.getTotalElements(), dto.getPage(), dto.getSize(), pg.getContent());
    }

    public PageResult<AttendanceSchedule> supervisorPage(ScheduleQueryDTO dto) {
        Long supervisorId = UserContext.getCurrent().getUserId();
        Pageable pageable = PageRequest.of(
                Math.max(dto.getPage() - 1, 0),
                dto.getSize(),
                Sort.by(Sort.Direction.DESC, "scheduleDate", "id")
        );
        Page<AttendanceSchedule> pg = scheduleRepo.searchPage(
                null, supervisorId, dto.getEmployeeId(), dto.getStatus(),
                dto.getStartDate(), dto.getEndDate(), dto.getKeyword(), pageable
        );
        return PageResult.of(pg.getTotalElements(), dto.getPage(), dto.getSize(), pg.getContent());
    }

    public PageResult<AttendanceSchedule> accountantPage(ScheduleQueryDTO dto) {
        Pageable pageable = PageRequest.of(
                Math.max(dto.getPage() - 1, 0),
                dto.getSize(),
                Sort.by(Sort.Direction.DESC, "scheduleDate", "id")
        );
        Page<AttendanceSchedule> pg = scheduleRepo.searchPage(
                null, null, dto.getEmployeeId(), dto.getStatus(),
                dto.getStartDate(), dto.getEndDate(), dto.getKeyword(), pageable
        );
        return PageResult.of(pg.getTotalElements(), dto.getPage(), dto.getSize(), pg.getContent());
    }

    @Transactional
    public AttendanceSchedule confirmBySupervisor(Long id, String remark) {
        AttendanceSchedule s = scheduleRepo.findById(id)
                .orElseThrow(() -> new BizException("排班记录不存在"));
        Long current = UserContext.getCurrent().getUserId();
        if (!s.getSupervisorId().equals(current)) {
            throw new BizException("仅对应驻场主管可确认此排班");
        }
        if (s.getStatus() == ScheduleStatus.EXCEPTION) {
            throw new BizException("该排班存在异常，请通过异常确认流程处理，不可直接确认排班");
        }
        stateMachine.transitionSchedule(s, ScheduleStatus.CONFIRMED, UserContext.getCurrent().getUserName());
        s.setConfirmedAt(LocalDateTime.now());
        s.setConfirmedRemark(remark);
        return scheduleRepo.save(s);
    }
}
