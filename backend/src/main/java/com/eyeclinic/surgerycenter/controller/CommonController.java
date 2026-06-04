package com.eyeclinic.surgerycenter.controller;

import com.eyeclinic.surgerycenter.common.Result;
import com.eyeclinic.surgerycenter.dto.WorkflowVO;
import com.eyeclinic.surgerycenter.entity.Patient;
import com.eyeclinic.surgerycenter.entity.SurgerySchedule;
import com.eyeclinic.surgerycenter.entity.User;
import com.eyeclinic.surgerycenter.enums.RoleType;
import com.eyeclinic.surgerycenter.repository.PatientRepository;
import com.eyeclinic.surgerycenter.repository.UserRepository;
import com.eyeclinic.surgerycenter.service.SurgeryScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommonController {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final SurgeryScheduleService scheduleService;

    @GetMapping("/users")
    public Result<List<Map<String, Object>>> getUsers(
            @RequestParam(required = false) RoleType role) {
        List<User> users;
        if (role != null) {
            users = userRepository.findByRole(role);
        } else {
            users = userRepository.findByActiveTrue();
        }

        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("realName", u.getRealName());
            map.put("role", u.getRole());
            map.put("roleName", u.getRole().getDescription());
            map.put("department", u.getDepartment());
            return map;
        }).collect(Collectors.toList());

        return Result.success(result);
    }

    @GetMapping("/schedules")
    public Result<List<Map<String, Object>>> getSchedules(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate start = LocalDate.parse(startDate, formatter);
        LocalDate end = LocalDate.parse(endDate, formatter);

        List<SurgerySchedule> schedules = scheduleService.getScheduleByDateRange(start, end);

        List<Map<String, Object>> result = schedules.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("workflowNo", s.getWorkflow().getWorkflowNo());
            map.put("patientName", s.getWorkflow().getPatient().getName());
            map.put("surgeryType", s.getSurgeryType());
            map.put("surgeryTypeName", s.getSurgeryType().getDescription());
            map.put("surgeryDate", s.getSurgeryDate().toString());
            map.put("startTime", s.getStartTime().toString());
            map.put("endTime", s.getEndTime() != null ? s.getEndTime().toString() : null);
            map.put("operatingRoom", s.getOperatingRoom());
            map.put("surgeonName", s.getSurgeon() != null ? s.getSurgeon().getRealName() : null);
            map.put("materialList", s.getMaterialList());
            return map;
        }).collect(Collectors.toList());

        return Result.success(result);
    }

    @GetMapping("/export/workflows")
    public Result<String> exportWorkflows() {
        return Result.success("导出功能已模拟实现，实际项目中可生成Excel/PDF文件");
    }

    @GetMapping("/export/schedules")
    public Result<String> exportSchedules() {
        return Result.success("导出功能已模拟实现，实际项目中可生成Excel/PDF文件");
    }

    @GetMapping("/patients")
    public Result<List<Map<String, Object>>> getPatients() {
        List<Patient> patients = patientRepository.findAll();
        List<Map<String, Object>> result = patients.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("patientNo", p.getPatientNo());
            map.put("name", p.getName());
            map.put("gender", p.getGender());
            map.put("age", p.getAge());
            map.put("phone", p.getPhone());
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }
}
