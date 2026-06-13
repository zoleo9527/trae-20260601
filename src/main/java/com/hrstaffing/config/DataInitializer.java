package com.hrstaffing.config;

import com.hrstaffing.entity.AttendanceException;
import com.hrstaffing.entity.AttendanceSchedule;
import com.hrstaffing.entity.Employee;
import com.hrstaffing.entity.RejectRecord;
import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ExceptionType;
import com.hrstaffing.enums.ScheduleStatus;
import com.hrstaffing.repository.AttendanceExceptionRepository;
import com.hrstaffing.repository.AttendanceScheduleRepository;
import com.hrstaffing.repository.EmployeeRepository;
import com.hrstaffing.repository.RejectRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final EmployeeRepository employeeRepo;
    private final AttendanceScheduleRepository scheduleRepo;
    private final AttendanceExceptionRepository exceptionRepo;
    private final RejectRecordRepository rejectRepo;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("开始初始化演示数据...");
        initEmployees();
        initSchedules();
        initExceptions();
        log.info("演示数据初始化完成");
    }

    private void initEmployees() {
        String[][] empData = {
                {"EMP001", "张伟", "13800000001", "110101199001011111", "华为科技", "深圳坂田基地", "产线作业员"},
                {"EMP002", "李娜", "13800000002", "110101199001011112", "华为科技", "深圳坂田基地", "仓库管理员"},
                {"EMP003", "王强", "13800000003", "110101199001011113", "富士康", "郑州航空港", "质检专员"},
                {"EMP004", "刘芳", "13800000004", "110101199001011114", "富士康", "郑州航空港", "产线组长"},
                {"EMP005", "陈鹏", "13800000005", "110101199001011115", "比亚迪", "西安草堂", "装配技术员"},
                {"EMP006", "赵敏", "13800000006", "110101199001011116", "比亚迪", "西安草堂", "物料员"},
                {"EMP007", "孙磊", "13800000007", "110101199001011117", "立讯精密", "昆山厂区", "SMT操作员"},
                {"EMP008", "周婷", "13800000008", "110101199001011118", "立讯精密", "昆山厂区", "包装员"},
        };
        Object[][] ownership = {
                {101L, "招聘专员-张敏", 201L, "驻场主管-李强"},
                {102L, "招聘专员-王芳", 201L, "驻场主管-李强"},
                {101L, "招聘专员-张敏", 202L, "驻场主管-赵刚"},
                {102L, "招聘专员-王芳", 202L, "驻场主管-赵刚"},
                {101L, "招聘专员-张敏", 203L, "驻场主管-孙磊"},
                {102L, "招聘专员-王芳", 203L, "驻场主管-孙磊"},
                {101L, "招聘专员-张敏", 201L, "驻场主管-李强"},
                {102L, "招聘专员-王芳", 202L, "驻场主管-赵刚"},
        };
        for (int i = 0; i < empData.length; i++) {
            Employee e = new Employee();
            e.setEmployeeNo(empData[i][0]);
            e.setName(empData[i][1]);
            e.setPhone(empData[i][2]);
            e.setIdCard(empData[i][3]);
            e.setClientCompany(empData[i][4]);
            e.setSiteLocation(empData[i][5]);
            e.setPosition(empData[i][6]);
            e.setRecruiterId((Long) ownership[i][0]);
            e.setRecruiterName((String) ownership[i][1]);
            e.setSupervisorId((Long) ownership[i][2]);
            e.setSupervisorName((String) ownership[i][3]);
            e.setStatus("ACTIVE");
            employeeRepo.save(e);
        }
    }

    private void initSchedules() {
        LocalDate base = LocalDate.now().minusDays(10);
        LocalTime s8 = LocalTime.of(8, 0);
        LocalTime s20 = LocalTime.of(20, 0);
        LocalTime s9 = LocalTime.of(9, 0);
        LocalTime s18 = LocalTime.of(18, 0);
        BigDecimal h12 = new BigDecimal("12");
        BigDecimal h9 = new BigDecimal("9");

        employeeRepo.findAll().forEach(emp -> {
            for (int i = 0; i < 8; i++) {
                AttendanceSchedule s = new AttendanceSchedule();
                LocalDate d = base.plusDays(i);
                s.setEmployeeId(emp.getId());
                s.setEmployeeNo(emp.getEmployeeNo());
                s.setEmployeeName(emp.getName());
                s.setScheduleDate(d);
                if (i % 2 == 0) {
                    s.setShiftStart(s8); s.setShiftEnd(s20); s.setScheduledHours(h12);
                } else {
                    s.setShiftStart(s9); s.setShiftEnd(s18); s.setScheduledHours(h9);
                }
                s.setRecruiterId(emp.getRecruiterId());
                s.setRecruiterName(emp.getRecruiterName());
                s.setSupervisorId(emp.getSupervisorId());
                s.setSupervisorName(emp.getSupervisorName());
                s.setScheduleRemark("常规排班");

                int idx = (int)(emp.getId() % 10) + i;
                if (idx % 7 == 0) {
                    s.setStatus(ScheduleStatus.DRAFT);
                } else if (idx % 7 == 1) {
                    s.setStatus(ScheduleStatus.SUBMITTED);
                    s.setSubmittedAt(LocalDateTime.now().minusDays(1));
                } else if (idx % 7 == 2) {
                    s.setStatus(ScheduleStatus.CONFIRMED);
                    s.setSubmittedAt(LocalDateTime.now().minusDays(3));
                    s.setConfirmedAt(LocalDateTime.now().minusDays(2));
                    s.setConfirmedRemark("现场考勤核对无误");
                    s.setActualPunchIn(s.getShiftStart().minusMinutes(5));
                    s.setActualPunchOut(s.getShiftEnd().plusMinutes(10));
                    s.setActualWorkHours(s.getScheduledHours());
                } else if (idx % 7 == 3) {
                    s.setStatus(ScheduleStatus.EXCEPTION);
                    s.setSubmittedAt(LocalDateTime.now().minusDays(4));
                } else {
                    s.setStatus(ScheduleStatus.SUBMITTED);
                    s.setSubmittedAt(LocalDateTime.now().minusHours(6));
                }
                scheduleRepo.save(s);
            }
        });
    }

    private void initExceptions() {
        int idx = 0;
        for (AttendanceSchedule s : scheduleRepo.findByStatus(ScheduleStatus.EXCEPTION)) {
            AttendanceException e = new AttendanceException();
            e.setScheduleId(s.getId());
            e.setEmployeeId(s.getEmployeeId());
            e.setEmployeeNo(s.getEmployeeNo());
            e.setEmployeeName(s.getEmployeeName());
            e.setExceptionDate(s.getScheduleDate());

            int t = idx % 4;
            idx++;
            if (t == 0) {
                e.setExceptionType(ExceptionType.MISSING_PUNCH);
                e.setDescription("下班未打卡，现场记录显示实际已出勤至20:00");
                e.setAffectedHours(new BigDecimal("2"));
                e.setSiteNote("现场主管签字确认实际出勤，附件有纸质考勤条");
                e.setStatus(ExceptionStatus.PENDING);
            } else if (t == 1) {
                e.setExceptionType(ExceptionType.OVERTIME_UNAPPROVED);
                e.setDescription("周末加班4小时未走OA审批，客户现场紧急出货要求加班");
                e.setAffectedHours(new BigDecimal("4"));
                e.setSiteNote("现场微信沟通截图已上传");
                e.setStatus(ExceptionStatus.REJECTED);
                e.setRejectCount(1);
                e.setRejectDeadline(LocalDateTime.now().plusHours(8));
                e.setLatestRejectReason("缺少客户方HR签字确认单，请补充后重提");
                e.setLastRejectedAt(LocalDateTime.now().minusHours(4));
                e.setLastRejectedBy(s.getSupervisorId());
                e.setLastRejectedByName(s.getSupervisorName());
            } else if (t == 2) {
                e.setExceptionType(ExceptionType.LATE);
                e.setDescription("迟到45分钟，因地铁故障，已在企业微信报备");
                e.setAffectedHours(new BigDecimal("0.75"));
                e.setStatus(ExceptionStatus.SUPPLEMENTED);
                e.setRejectCount(1);
                e.setRejectDeadline(LocalDateTime.now().plusHours(24));
                e.setLatestRejectReason("缺少地铁故障证明材料");
                e.setLastRejectedAt(LocalDateTime.now().minusHours(12));
                e.setLastRejectedBy(s.getSupervisorId());
                e.setLastRejectedByName(s.getSupervisorName());
                e.setSupplementedAt(LocalDateTime.now().minusHours(2));
                e.setSupplementedBy(s.getRecruiterId());
                e.setSupplementRemark("已补充地铁官方故障通知截图，见附件");
            } else {
                e.setExceptionType(ExceptionType.EARLY_LEAVE);
                e.setDescription("早退30分钟，家中有急事提前离开，已电话报备主管");
                e.setAffectedHours(new BigDecimal("0.5"));
                e.setStatus(ExceptionStatus.CONFIRMED);
                e.setConfirmedAt(LocalDateTime.now().minusDays(1));
                e.setConfirmedBy(s.getSupervisorId());
                e.setConfirmRemark("情况属实，按早退处理，扣除相应工时");
            }
            e.setRecruiterId(s.getRecruiterId());
            e.setRecruiterName(s.getRecruiterName());
            e.setSupervisorId(s.getSupervisorId());
            e.setSupervisorName(s.getSupervisorName());
            AttendanceException saved = exceptionRepo.save(e);

            if (e.getStatus() == ExceptionStatus.REJECTED
                    || e.getStatus() == ExceptionStatus.SUPPLEMENTED
                    || e.getStatus() == ExceptionStatus.CONFIRMED) {
                if (e.getLastRejectedAt() != null) {
                    RejectRecord rr = new RejectRecord();
                    rr.setExceptionId(saved.getId());
                    rr.setRejectReason(e.getLatestRejectReason());
                    rr.setDeadline(e.getRejectDeadline());
                    rr.setRejectedBy(e.getLastRejectedBy());
                    rr.setRejectedByName(e.getLastRejectedByName());
                    rr.setSiteSnapshot("客户现场微信沟通记录截图");
                    rejectRepo.save(rr);
                }
            }
        }
    }
}
