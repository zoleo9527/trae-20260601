package com.security.survey.config;

import com.security.survey.entity.*;
import com.security.survey.enums.ConfirmStatus;
import com.security.survey.enums.RoleType;
import com.security.survey.enums.SurveyStatus;
import com.security.survey.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointSurveyRepository surveyRepository;

    @Autowired
    private PlanConfirmRepository planRepository;

    @Autowired
    private RemarkRepository remarkRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            initUsers();
            initSurveyAndPlanData();
        }
    }

    private void initUsers() {
        User pm = new User();
        pm.setUsername("pm");
        pm.setPassword(passwordEncoder.encode("123456"));
        pm.setRealName("张明-项目经理");
        pm.setRole(RoleType.PROJECT_MANAGER);
        pm.setPhone("13800138001");
        pm.setDepartment("项目部");
        userRepository.save(pm);

        User leader = new User();
        leader.setUsername("leader");
        leader.setPassword(passwordEncoder.encode("123456"));
        leader.setRealName("李强-施工队长");
        leader.setRole(RoleType.CONSTRUCTION_LEADER);
        leader.setPhone("13800138002");
        leader.setDepartment("施工部");
        userRepository.save(leader);

        User engineer = new User();
        engineer.setUsername("engineer");
        engineer.setPassword(passwordEncoder.encode("123456"));
        engineer.setRealName("王工-售后工程师");
        engineer.setRole(RoleType.AFTER_SALES_ENGINEER);
        engineer.setPhone("13800138003");
        engineer.setDepartment("售后部");
        userRepository.save(engineer);
    }

    @Transactional
    public void initSurveyAndPlanData() {
        User pm = userRepository.findByUsername("pm").orElseThrow();
        User leader = userRepository.findByUsername("leader").orElseThrow();
        User engineer = userRepository.findByUsername("engineer").orElseThrow();

        LocalDateTime now = LocalDateTime.now();

        List<PointSurvey> surveys = new ArrayList<>();

        PointSurvey s1 = createSurvey("AX-2026-001", "安信大厦智能监控系统", "安信地产",
                "北京市朝阳区建国路88号", 45, SurveyStatus.APPROVED, pm, leader,
                now.minusDays(7), now.minusDays(5), false, null, null);
        surveys.add(s1);

        PointSurvey s2 = createSurvey("AX-2026-002", "恒基商业广场安防升级", "恒基商业",
                "上海市浦东新区世纪大道100号", 78, SurveyStatus.IN_PROGRESS, pm, engineer,
                now.minusDays(3), now.plusDays(2), false, null, null);
        surveys.add(s2);

        PointSurvey s3 = createSurvey("AX-2026-003", "绿城小区门禁改造", "绿城物业",
                "广州市天河区体育西路200号", 32, SurveyStatus.STUCK, leader, engineer,
                now.minusDays(5), now.minusDays(2), true, "业主方临时变更需求，点位增加20个，需重新评估",
                now.minusDays(2));
        surveys.add(s3);

        PointSurvey s4 = createSurvey("AX-2026-004", "金融中心周界报警系统", "金控集团",
                "深圳市南山区科技园路1号", 56, SurveyStatus.SUBMITTED, pm, leader,
                now.minusDays(4), now.minusDays(1), false, null, null);
        surveys.add(s4);

        PointSurvey s5 = createSurvey("AX-2026-005", "物流园区监控全覆盖", "顺丰物流",
                "杭州市余杭区良渚物流园", 120, SurveyStatus.REVIEWING, leader, engineer,
                now.minusDays(6), now.minusDays(3), false, null, null);
        surveys.add(s5);

        PointSurvey s6 = createSurvey("AX-2026-006", "医院病房呼叫系统", "协和医院",
                "成都市武侯区国学巷37号", 200, SurveyStatus.REJECTED, pm, leader,
                now.minusDays(10), now.minusDays(7), false, null, null);
        surveys.add(s6);

        PointSurvey s7 = createSurvey("AX-2026-007", "学校校园一卡通", "实验中学",
                "武汉市洪山区珞喻路100号", 85, SurveyStatus.STUCK, pm, engineer,
                now.minusDays(8), now.minusDays(4), true, "暑假施工窗口有限，需协调教育局审批",
                now.minusDays(4));
        surveys.add(s7);

        surveys = surveyRepository.saveAll(surveys);

        addSurveyRemarks(surveys.get(0), pm, leader);
        addSurveyRemarks(surveys.get(1), leader, engineer);
        addSurveyRemarks(surveys.get(2), engineer, pm);
        addSurveyRemarks(surveys.get(3), pm, leader);
        addSurveyRemarks(surveys.get(4), leader, engineer);
        addSurveyRemarks(surveys.get(5), engineer, pm);
        addSurveyRemarks(surveys.get(6), pm, engineer);

        createPlanWithInheritedRemarks(surveys.get(0), pm, leader, ConfirmStatus.CONFIRMED, false, null, null);
        createPlanWithInheritedRemarks(surveys.get(1), leader, engineer, ConfirmStatus.CUSTOMER_REVIEWING, false, null, null);
        createPlanWithInheritedRemarks(surveys.get(4), engineer, pm, ConfirmStatus.STUCK, true,
                "客户对设备选型有异议，要求改用海康威视高端机型", now.minusHours(8));
        createPlanWithInheritedRemarks(surveys.get(5), pm, leader, ConfirmStatus.REJECTED, false, null, null);
    }

    private PointSurvey createSurvey(String code, String name, String customer, String address,
                                     int pointCount, SurveyStatus status, User createdBy, User assignedTo,
                                     LocalDateTime createdAt, LocalDateTime updatedAt,
                                     boolean stuck, String stuckReason, LocalDateTime stuckAt) {
        PointSurvey s = new PointSurvey();
        s.setProjectCode(code);
        s.setProjectName(name);
        s.setCustomerName(customer);
        s.setAddress(address);
        s.setPointCount(pointCount);
        s.setStatus(status);
        s.setCreatedBy(createdBy);
        s.setAssignedTo(assignedTo);
        s.setSurveyDate(createdAt.toLocalDate().atStartOfDay());
        s.setDeadline(updatedAt.plusDays(7));
        s.setStuck(stuck);
        s.setStuckReason(stuckReason);
        s.setStuckAt(stuckAt);
        s.setCreatedAt(createdAt);
        s.setUpdatedAt(updatedAt);
        s.setPointDescription(generatePointDescription(name, pointCount));
        return s;
    }

    private void addSurveyRemarks(PointSurvey survey, User user1, User user2) {
        addRemark("SURVEY", survey.getId(),
                "现场勘察完成，共发现 " + survey.getPointCount() + " 个点位需要布控，包含出入口、电梯厅、走廊、停车场等区域",
                user1);

        if (survey.getStatus() == SurveyStatus.STUCK) {
            addRemark("SURVEY", survey.getId(),
                    "【卡住】" + survey.getStuckReason(), user2);
        }

        if (survey.getStatus() == SurveyStatus.REJECTED) {
            addRemark("SURVEY", survey.getId(),
                    "图纸点位标注不清晰，特别是负二层停车场区域，请重新勘察后提交", user1);
        }

        if (survey.getStatus() == SurveyStatus.APPROVED) {
            addRemark("SURVEY", survey.getId(),
                    "点位勘察完整，覆盖了所有重要区域，同意进入方案阶段", user1);
        }

        if (survey.getStatus() == SurveyStatus.SUBMITTED || survey.getStatus() == SurveyStatus.REVIEWING) {
            addRemark("SURVEY", survey.getId(),
                    "已完成现场测量，摄像头点位图已上传，请项目经理审核", user2);
        }

        addRemark("SURVEY", survey.getId(),
                "补充：弱电井位置已确认，走线方案可行，无需额外开槽", user2);
    }

    private void createPlanWithInheritedRemarks(PointSurvey survey, User createdBy, User assignedTo,
                                                ConfirmStatus status, boolean stuck, String stuckReason, LocalDateTime stuckAt) {
        PlanConfirm plan = new PlanConfirm();
        plan.setSurvey(survey);
        plan.setProjectCode(survey.getProjectCode());
        plan.setProjectName(survey.getProjectName());
        plan.setPlanContent(generatePlanContent(survey));
        plan.setEquipmentList(generateEquipmentList(survey.getPointCount()));
        plan.setEstimatedCost(survey.getPointCount() * 3500.0);
        plan.setConstructionDays((int) Math.ceil(survey.getPointCount() / 10.0) + 5);
        plan.setStatus(status);
        plan.setCreatedBy(createdBy);
        plan.setAssignedTo(assignedTo);
        plan.setPlanDate(LocalDateTime.now());
        plan.setDeadline(LocalDateTime.now().plusDays(14));
        plan.setStuck(stuck);
        plan.setStuckReason(stuckReason);
        plan.setStuckAt(stuckAt);
        plan.setConfirmedAt(status == ConfirmStatus.CONFIRMED ? LocalDateTime.now() : null);

        plan = planRepository.save(plan);

        List<Remark> surveyRemarks = remarkRepository.findBySourceTypeAndSourceIdOrderByCreatedAtDesc("SURVEY", survey.getId());
        for (Remark sr : surveyRemarks) {
            Remark r = new Remark();
            r.setContent("[继承自勘察] " + sr.getContent());
            r.setSourceType("PLAN");
            r.setSourceId(plan.getId());
            r.setCreatedBy(sr.getCreatedBy());
            r.setInherited(true);
            r.setCreatedAt(sr.getCreatedAt().plusHours(1));
            remarkRepository.save(r);
        }

        addRemark("PLAN", plan.getId(),
                "方案初稿完成，设备选型采用海康威视主流产品，性价比最优", createdBy);

        if (status == ConfirmStatus.CONFIRMED) {
            addRemark("PLAN", plan.getId(),
                    "客户已确认方案，预计下周进场施工", assignedTo);
        }

        if (status == ConfirmStatus.CUSTOMER_REVIEWING) {
            addRemark("PLAN", plan.getId(),
                    "方案已发送客户，预计3个工作日内反馈", assignedTo);
        }

        if (status == ConfirmStatus.STUCK) {
            addRemark("PLAN", plan.getId(),
                    "【卡住】" + stuckReason, assignedTo);
        }

        if (status == ConfirmStatus.REJECTED) {
            addRemark("PLAN", plan.getId(),
                    "客户认为报价偏高，希望降低10%预算，同时保留原有设备档次", createdBy);
            addRemark("PLAN", plan.getId(),
                    "已与供应商沟通，批量采购可降低5%成本，需要求客户增加合同量", assignedTo);
        }
    }

    private Remark addRemark(String sourceType, Long sourceId, String content, User createdBy) {
        Remark r = new Remark();
        r.setContent(content);
        r.setSourceType(sourceType);
        r.setSourceId(sourceId);
        r.setCreatedBy(createdBy);
        r.setInherited(false);
        r.setCreatedAt(LocalDateTime.now().minusMinutes((long) (Math.random() * 120)));
        return remarkRepository.save(r);
    }

    private String generatePointDescription(String projectName, int count) {
        return projectName + "点位分布：\n" +
                "- 主出入口：4个球机\n" +
                "- 地下车库：" + (count / 3) + "个枪机\n" +
                "- 电梯厅/轿厢：" + (count / 5) + "个半球\n" +
                "- 走廊通道：" + (count / 4) + "个枪机\n" +
                "- 机房/配电室：" + (count / 10) + "个半球\n" +
                "- 周界围墙：" + (count / 6) + "个球机\n" +
                "- 其他区域：" + (count - count/3 - count/5 - count/4 - count/10 - count/6) + "个点位";
    }

    private String generatePlanContent(PointSurvey s) {
        return "一、项目概况\n" +
                s.getProjectName() + "安防系统建设方案，共" + s.getPointCount() + "个监控点位。\n\n" +
                "二、设计依据\n" +
                "1. GB50348-2018《安全防范工程技术标准》\n" +
                "2. 现场勘察记录及业主要求\n\n" +
                "三、系统架构\n" +
                "采用高清网络视频监控系统，前端摄像头通过光纤汇聚到机房NVR，统一存储管理。\n\n" +
                "四、施工方案\n" +
                "1. 管路敷设：采用镀锌钢管暗敷\n" +
                "2. 设备安装：摄像头离地2.8米，护罩防水\n" +
                "3. 系统调试：逐点测试图像质量、存储回放";
    }

    private String generateEquipmentList(int count) {
        return "主要设备清单：\n" +
                "1. 400万像素红外球机：" + (count / 4) + "台\n" +
                "2. 400万像素红外枪机：" + (count / 2) + "台\n" +
                "3. 400万像素电梯半球：" + (count / 5) + "台\n" +
                "4. 64路NVR录像机：" + (count / 60 + 1) + "台\n" +
                "5. 4T监控硬盘：" + ((count / 60 + 1) * 8) + "块\n" +
                "6. 24口千兆交换机：" + (count / 24 + 1) + "台\n" +
                "7. 光纤收发器：若干\n" +
                "8. 监控管理平台：1套";
    }
}
