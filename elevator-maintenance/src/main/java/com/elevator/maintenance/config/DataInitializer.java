package com.elevator.maintenance.config;

import com.elevator.maintenance.entity.*;
import com.elevator.maintenance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ElevatorRepository elevatorRepository;
    @Autowired
    private MaintenancePlanRepository planRepository;
    @Autowired
    private CheckInRecordRepository checkInRepository;
    @Autowired
    private MaintenanceNoteRepository noteRepository;

    @Override
    public void run(String... args) {
        initUsers();
        initElevators();
        initMaintenancePlans();
        initCheckInRecords();
        initMaintenanceNotes();
    }

    private void initUsers() {
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword("123456");
        admin.setRealName("张主管");
        admin.setRole("SUPERVISOR");
        admin.setPhone("13800000001");
        userRepository.save(admin);

        User kefu = new User();
        kefu.setUsername("kefu");
        kefu.setPassword("123456");
        kefu.setRealName("李客服");
        kefu.setRole("CUSTOMER_SERVICE");
        kefu.setPhone("13800000002");
        userRepository.save(kefu);

        User jishi1 = new User();
        jishi1.setUsername("jishi1");
        jishi1.setPassword("123456");
        jishi1.setRealName("王技师");
        jishi1.setRole("TECHNICIAN");
        jishi1.setPhone("13800000003");
        userRepository.save(jishi1);

        User jishi2 = new User();
        jishi2.setUsername("jishi2");
        jishi2.setPassword("123456");
        jishi2.setRealName("刘技师");
        jishi2.setRole("TECHNICIAN");
        jishi2.setPhone("13800000004");
        userRepository.save(jishi2);
    }

    private void initElevators() {
        Elevator e1 = new Elevator();
        e1.setProjectName("阳光花园");
        e1.setElevatorNo("DT-001");
        e1.setAddress("朝阳区阳光路1号");
        e1.setModel("OTIS-3200");
        e1.setManufacturer("奥的斯电梯");
        e1.setInstallDate("2020-03-15");
        e1.setNextMaintenanceDate("2026-06-20");
        e1.setStatus("正常");
        elevatorRepository.save(e1);

        Elevator e2 = new Elevator();
        e2.setProjectName("阳光花园");
        e2.setElevatorNo("DT-002");
        e2.setAddress("朝阳区阳光路1号");
        e2.setModel("OTIS-3200");
        e2.setManufacturer("奥的斯电梯");
        e2.setInstallDate("2020-03-15");
        e2.setNextMaintenanceDate("2026-06-25");
        e2.setStatus("正常");
        elevatorRepository.save(e2);

        Elevator e3 = new Elevator();
        e3.setProjectName("翠苑小区");
        e3.setElevatorNo("DT-003");
        e3.setAddress("海淀区翠苑路8号");
        e3.setModel("Schindler-5500");
        e3.setManufacturer("迅达电梯");
        e3.setInstallDate("2019-08-20");
        e3.setNextMaintenanceDate("2026-06-18");
        e3.setStatus("正常");
        elevatorRepository.save(e3);

        Elevator e4 = new Elevator();
        e4.setProjectName("翠苑小区");
        e4.setElevatorNo("DT-004");
        e4.setAddress("海淀区翠苑路8号");
        e4.setModel("Schindler-5500");
        e4.setManufacturer("迅达电梯");
        e4.setInstallDate("2019-08-20");
        e4.setNextMaintenanceDate("2026-06-22");
        e4.setStatus("待修");
        elevatorRepository.save(e4);

        Elevator e5 = new Elevator();
        e5.setProjectName("金色年华");
        e5.setElevatorNo("DT-005");
        e5.setAddress("丰台区金色大道15号");
        e5.setModel("Mitsubishi-LEHY");
        e5.setManufacturer("三菱电梯");
        e5.setInstallDate("2021-01-10");
        e5.setNextMaintenanceDate("2026-06-30");
        e5.setStatus("正常");
        elevatorRepository.save(e5);
    }

    private void initMaintenancePlans() {
        User admin = userRepository.findByUsername("admin").get();
        User kefu = userRepository.findByUsername("kefu").get();
        User jishi1 = userRepository.findByUsername("jishi1").get();
        User jishi2 = userRepository.findByUsername("jishi2").get();

        MaintenancePlan p1 = new MaintenancePlan();
        p1.setPlanNo("MP202606010001");
        p1.setElevatorId(1L);
        p1.setTechnicianId(jishi1.getId());
        p1.setPlanTime(LocalDateTime.now().plusDays(1));
        p1.setContent("月度常规维保：检查门系统、安全回路、制动器、导轨润滑");
        p1.setStatus("PENDING");
        planRepository.save(p1);

        MaintenancePlan p2 = new MaintenancePlan();
        p2.setPlanNo("MP202606010002");
        p2.setElevatorId(2L);
        p2.setTechnicianId(jishi1.getId());
        p2.setDispatcherId(kefu.getId());
        p2.setPlanTime(LocalDateTime.now().plusDays(2));
        p2.setContent("月度常规维保：检查门系统、安全回路、制动器、导轨润滑");
        p2.setStatus("DISPATCHED");
        planRepository.save(p2);

        MaintenancePlan p3 = new MaintenancePlan();
        p3.setPlanNo("MP202606010003");
        p3.setElevatorId(3L);
        p3.setTechnicianId(jishi2.getId());
        p3.setDispatcherId(kefu.getId());
        p3.setPlanTime(LocalDateTime.now().minusHours(2));
        p3.setContent("季度全面维保：包含限速器测试、缓冲器检查、紧急通讯测试");
        p3.setStatus("IN_PROGRESS");
        planRepository.save(p3);

        MaintenancePlan p4 = new MaintenancePlan();
        p4.setPlanNo("MP202606010004");
        p4.setElevatorId(4L);
        p4.setTechnicianId(jishi1.getId());
        p4.setDispatcherId(kefu.getId());
        p4.setPlanTime(LocalDateTime.now().minusDays(1));
        p4.setContent("故障维修：电梯异响、开关门不顺畅");
        p4.setStatus("FOR_REVIEW");
        planRepository.save(p4);

        MaintenancePlan p5 = new MaintenancePlan();
        p5.setPlanNo("MP202606010005");
        p5.setElevatorId(5L);
        p5.setTechnicianId(jishi2.getId());
        p5.setDispatcherId(kefu.getId());
        p5.setSupervisorId(admin.getId());
        p5.setPlanTime(LocalDateTime.now().minusDays(3));
        p5.setContent("月度常规维保：检查门系统、安全回路、制动器、导轨润滑");
        p5.setStatus("COMPLETED");
        p5.setReviewRemark("维保工作完成，各项指标正常");
        planRepository.save(p5);

        MaintenancePlan p6 = new MaintenancePlan();
        p6.setPlanNo("MP202606010006");
        p6.setElevatorId(1L);
        p6.setTechnicianId(jishi2.getId());
        p6.setDispatcherId(kefu.getId());
        p6.setSupervisorId(admin.getId());
        p6.setPlanTime(LocalDateTime.now().minusDays(5));
        p6.setContent("半年检：全面安全检查，包含负载测试");
        p6.setStatus("COMPLETED");
        p6.setReviewRemark("年检合格，已出具报告");
        planRepository.save(p6);

        MaintenancePlan p7 = new MaintenancePlan();
        p7.setPlanNo("MP202606010007");
        p7.setElevatorId(2L);
        p7.setTechnicianId(jishi1.getId());
        p7.setDispatcherId(kefu.getId());
        p7.setSupervisorId(admin.getId());
        p7.setPlanTime(LocalDateTime.now().minusDays(4));
        p7.setContent("故障维修：按钮失灵");
        p7.setStatus("REJECTED");
        p7.setReviewRemark("维修不彻底，需要重新处理");
        planRepository.save(p7);

        MaintenancePlan p8 = new MaintenancePlan();
        p8.setPlanNo("MP202606010008");
        p8.setElevatorId(3L);
        p8.setTechnicianId(jishi2.getId());
        p8.setDispatcherId(kefu.getId());
        p8.setPlanTime(LocalDateTime.now().plusDays(5));
        p8.setContent("专项检查：导轨垂直度检测");
        p8.setStatus("DISPATCHED");
        planRepository.save(p8);
    }

    private void initCheckInRecords() {
        User jishi1 = userRepository.findByUsername("jishi1").get();
        User jishi2 = userRepository.findByUsername("jishi2").get();

        CheckInRecord r1 = new CheckInRecord();
        r1.setPlanId(3L);
        r1.setTechnicianId(jishi2.getId());
        r1.setElevatorId(3L);
        r1.setCheckInTime(LocalDateTime.now().minusHours(1));
        r1.setLatitude(39.9042);
        r1.setLongitude(116.4074);
        r1.setLocationRemark("翠苑小区3号楼");
        r1.setPhotoData("base64_photo_data_1");
        checkInRepository.save(r1);

        CheckInRecord r2 = new CheckInRecord();
        r2.setPlanId(4L);
        r2.setTechnicianId(jishi1.getId());
        r2.setElevatorId(4L);
        r2.setCheckInTime(LocalDateTime.now().minusDays(1).plusHours(2));
        r2.setCheckOutTime(LocalDateTime.now().minusDays(1).plusHours(5));
        r2.setLatitude(39.9542);
        r2.setLongitude(116.3574);
        r2.setLocationRemark("翠苑小区4号楼");
        r2.setPhotoData("base64_photo_data_2");
        r2.setWorkContent("1. 检查门机系统，调整门滑块间隙\n2. 清洁轿顶和井道\n3. 检查限速器张紧装置");
        r2.setWorkResult("门异响问题已解决，开关门顺畅");
        r2.setProblemDesc("门滑块磨损导致异响");
        r2.setSolution("更换门滑块，调整门间隙");
        r2.setRemark("建议下次更换门机皮带");
        checkInRepository.save(r2);

        CheckInRecord r3 = new CheckInRecord();
        r3.setPlanId(5L);
        r3.setTechnicianId(jishi2.getId());
        r3.setElevatorId(5L);
        r3.setCheckInTime(LocalDateTime.now().minusDays(3).plusHours(1));
        r3.setCheckOutTime(LocalDateTime.now().minusDays(3).plusHours(4));
        r3.setLatitude(39.8542);
        r3.setLongitude(116.4574);
        r3.setLocationRemark("金色年华A座");
        r3.setPhotoData("base64_photo_data_3");
        r3.setWorkContent("月度常规维保，检查各项安全装置");
        r3.setWorkResult("所有项目检查合格");
        checkInRepository.save(r3);

        CheckInRecord r4 = new CheckInRecord();
        r4.setPlanId(6L);
        r4.setTechnicianId(jishi2.getId());
        r4.setElevatorId(1L);
        r4.setCheckInTime(LocalDateTime.now().minusDays(5).plusHours(1));
        r4.setCheckOutTime(LocalDateTime.now().minusDays(5).plusHours(6));
        r4.setLatitude(39.9042);
        r4.setLongitude(116.4074);
        r4.setLocationRemark("阳光花园1号楼");
        r4.setPhotoData("base64_photo_data_4");
        r4.setWorkContent("半年检：全面安全检查，负载测试125%");
        r4.setWorkResult("年检合格，已出具报告");
        checkInRepository.save(r4);

        CheckInRecord r5 = new CheckInRecord();
        r5.setPlanId(7L);
        r5.setTechnicianId(jishi1.getId());
        r5.setElevatorId(2L);
        r5.setCheckInTime(LocalDateTime.now().minusDays(4).plusHours(1));
        r5.setCheckOutTime(LocalDateTime.now().minusDays(4).plusHours(3));
        r5.setLatitude(39.9042);
        r5.setLongitude(116.4074);
        r5.setLocationRemark("阳光花园2号楼");
        r5.setPhotoData("base64_photo_data_5");
        r5.setWorkContent("更换3楼按钮");
        r5.setWorkResult("按钮更换完成，但1楼按钮仍有问题");
        r5.setProblemDesc("1楼按钮接触不良");
        r5.setSolution("需要重新处理");
        checkInRepository.save(r5);
    }

    private void initMaintenanceNotes() {
        User admin = userRepository.findByUsername("admin").get();
        User kefu = userRepository.findByUsername("kefu").get();
        User jishi1 = userRepository.findByUsername("jishi1").get();

        MaintenanceNote n1 = new MaintenanceNote();
        n1.setPlanId(2L);
        n1.setOperatorId(kefu.getId());
        n1.setContent("已派单给王技师，请按时完成");
        n1.setAction("DISPATCH");
        n1.setCreateTime(LocalDateTime.now().minusHours(3));
        noteRepository.save(n1);

        MaintenanceNote n2 = new MaintenanceNote();
        n2.setPlanId(4L);
        n2.setOperatorId(kefu.getId());
        n2.setContent("派单处理电梯异响问题");
        n2.setAction("DISPATCH");
        n2.setCreateTime(LocalDateTime.now().minusDays(1));
        noteRepository.save(n2);

        MaintenanceNote n3 = new MaintenanceNote();
        n3.setPlanId(4L);
        n3.setOperatorId(jishi1.getId());
        n3.setContent("已到达现场，开始检查");
        n3.setAction("CHECK_IN");
        n3.setCreateTime(LocalDateTime.now().minusDays(1).plusHours(2));
        noteRepository.save(n3);

        MaintenanceNote n4 = new MaintenanceNote();
        n4.setPlanId(4L);
        n4.setOperatorId(jishi1.getId());
        n4.setContent("发现门滑块磨损，已更换");
        n4.setAction("WORK_UPDATE");
        n4.setCreateTime(LocalDateTime.now().minusDays(1).plusHours(3));
        noteRepository.save(n4);

        MaintenanceNote n5 = new MaintenanceNote();
        n5.setPlanId(5L);
        n5.setOperatorId(admin.getId());
        n5.setContent("维保工作完成，各项指标正常，通过审核");
        n5.setAction("COMPLETED");
        n5.setCreateTime(LocalDateTime.now().minusDays(2));
        noteRepository.save(n5);

        MaintenanceNote n6 = new MaintenanceNote();
        n6.setPlanId(6L);
        n6.setOperatorId(admin.getId());
        n6.setContent("年检合格，已出具报告，通过审核");
        n6.setAction("COMPLETED");
        n6.setCreateTime(LocalDateTime.now().minusDays(4));
        noteRepository.save(n6);

        MaintenanceNote n7 = new MaintenanceNote();
        n7.setPlanId(7L);
        n7.setOperatorId(admin.getId());
        n7.setContent("维修不彻底，1楼按钮仍有问题，需要重新处理");
        n7.setAction("REJECTED");
        n7.setCreateTime(LocalDateTime.now().minusDays(3));
        noteRepository.save(n7);

        MaintenanceNote n8 = new MaintenanceNote();
        n8.setPlanId(8L);
        n8.setOperatorId(kefu.getId());
        n8.setContent("派单进行导轨垂直度检测");
        n8.setAction("DISPATCH");
        n8.setCreateTime(LocalDateTime.now().minusHours(2));
        noteRepository.save(n8);
    }
}
