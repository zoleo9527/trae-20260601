package com.medical.aesthetic.config;

import com.medical.aesthetic.context.UserContext;
import com.medical.aesthetic.entity.*;
import com.medical.aesthetic.enums.*;
import com.medical.aesthetic.repository.*;
import com.medical.aesthetic.service.HistoryNoteService;
import com.medical.aesthetic.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final ProjectMaterialRepository projectMaterialRepository;
    private final CustomerProjectRepository customerProjectRepository;
    private final MaterialReservationRepository materialReservationRepository;
    private final OrderRepository orderRepository;
    private final InstallmentPlanRepository installmentPlanRepository;
    private final ComplaintRepository complaintRepository;
    private final FollowUpRecordRepository followUpRecordRepository;
    private final HistoryNoteService historyNoteService;
    private final OrderService orderService;
    private final ExportTaskRepository exportTaskRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("开始初始化种子数据...");

        Employee consultant = createEmployee("张咨询", "zhangzx", RoleType.CONSULTANT, "资深咨询师，5年经验");
        Employee doctorAssistant = createEmployee("李助理", "lizhul", RoleType.DOCTOR_ASSISTANT, "主任医生助理");
        Employee customerService = createEmployee("王客服", "wangkf", RoleType.CUSTOMER_SERVICE, "客户服务主管");
        Employee doctor = createEmployee("陈医生", "chenys", RoleType.DOCTOR_ASSISTANT, "主刀医生");

        UserContext.setCurrentUser(consultant);

        Customer customer1 = createCustomer("王美丽", "13800138001", "女", LocalDate.of(1990, 5, 15), "无特殊病史", "青霉素过敏");
        Customer customer2 = createCustomer("李芳芳", "13800138002", "女", LocalDate.of(1988, 8, 20), "高血压", "无");
        Customer customer3 = createCustomer("张婷婷", "13800138003", "女", LocalDate.of(1995, 3, 10), "无", "无");
        Customer customer4 = createCustomer("刘思琪", "13800138004", "女", LocalDate.of(1992, 11, 25), "糖尿病", "海鲜过敏");

        Project project1 = createProject("假体隆鼻术", "鼻部整形", new BigDecimal("18800"), "硅胶假体植入隆鼻", "感冒期间禁用", "7-10天消肿", "可能出现假体移位、感染", 120, true);
        Project project2 = createProject("全脸自体脂肪填充", "面部填充", new BigDecimal("35000"), "抽取大腿脂肪填充面部凹陷", "经期禁用", "15-30天自然", "脂肪吸收、不对称", 180, true);
        Project project3 = createProject("双眼皮切开术", "眼部整形", new BigDecimal("12800"), "全切双眼皮成型", "瘢痕体质禁用", "3-6个月自然", "不对称、瘢痕增生", 90, true);
        Project project4 = createProject("玻尿酸丰唇", "微整形", new BigDecimal("6800"), "进口玻尿酸注射丰唇", "孕期禁用", "3-7天消肿", "过敏、栓塞", 30, true);
        Project project5 = createProject("下颌角整形", "轮廓整形", new BigDecimal("58000"), "下颌骨截骨整形", "严重心脏病禁用", "1-3个月消肿", "神经损伤、出血", 240, true);

        Material material1 = createMaterial("硅胶假体（韩式生科）", "假体材料", "三段式", "B202601001", LocalDate.of(2026, 1, 1), LocalDate.of(2031, 1, 1), "韩国韩式生科", new BigDecimal("3500"), 50, "常温干燥", MaterialStatus.AVAILABLE);
        Material material2 = createMaterial("自体脂肪处理套件", "手术耗材", "标准套装", "K202602015", LocalDate.of(2026, 2, 1), LocalDate.of(2029, 2, 1), "上海凯利", new BigDecimal("1200"), 30, "无菌冷藏", MaterialStatus.AVAILABLE);
        Material material3 = createMaterial("缝合线（可吸收）", "缝合材料", "5-0", "F202601088", LocalDate.of(2026, 1, 10), LocalDate.of(2028, 1, 10), "美国强生", new BigDecimal("280"), 200, "常温", MaterialStatus.AVAILABLE);
        Material material4 = createMaterial("玻尿酸（乔雅登）", "注射材料", "1ml", "Q202603020", LocalDate.of(2026, 3, 1), LocalDate.of(2028, 3, 1), "美国艾尔建", new BigDecimal("3800"), 80, "2-8°C冷藏", MaterialStatus.AVAILABLE);
        Material material5 = createMaterial("膨胀海绵", "止血材料", "10*20mm", "P202601003", LocalDate.of(2026, 1, 15), LocalDate.of(2029, 1, 15), "北京华医", new BigDecimal("120"), 150, "常温", MaterialStatus.AVAILABLE);
        Material material6 = createMaterial("消肿止痛贴", "术后护理", "5贴/盒", "X202602012", LocalDate.of(2026, 2, 10), LocalDate.of(2028, 2, 10), "云南白药", new BigDecimal("88"), 100, "常温", MaterialStatus.AVAILABLE);
        Material material7 = createMaterial("截骨手术器械包", "手术器械", "下颌角专用", "Q202512008", LocalDate.of(2025, 12, 1), LocalDate.of(2027, 12, 1), "德国蛇牌", new BigDecimal("12000"), 10, "无菌存储", MaterialStatus.AVAILABLE);
        Material material8 = createMaterial("麻醉药品（利多卡因）", "麻醉药品", "20ml:400mg", "M202601055", LocalDate.of(2026, 1, 20), LocalDate.of(2028, 1, 20), "上海恒瑞", new BigDecimal("450"), 200, "阴凉处", MaterialStatus.AVAILABLE);

        projectMaterialRepository.save(ProjectMaterial.builder().project(project1).material(material1).quantity(1).usageDescription("隆鼻假体").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project1).material(material3).quantity(2).usageDescription("缝合用").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project1).material(material5).quantity(2).usageDescription("术后止血").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project2).material(material2).quantity(1).usageDescription("脂肪处理").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project2).material(material3).quantity(3).usageDescription("缝合用").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project3).material(material3).quantity(2).usageDescription("缝合用").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project3).material(material6).quantity(1).usageDescription("术后消肿").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project4).material(material4).quantity(1).usageDescription("丰唇注射").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project5).material(material7).quantity(1).usageDescription("截骨手术").build());
        projectMaterialRepository.save(ProjectMaterial.builder().project(project5).material(material8).quantity(2).usageDescription("手术麻醉").build());

        log.info("基础数据初始化完成，开始创建业务场景数据...");

        createScenario1_PromiseInconsistency(customer1, project1, consultant, doctorAssistant, doctor, material1, material3, material5);
        createScenario2_PostoperativeComplaint(customer2, project3, consultant, doctorAssistant, customerService, doctor, material3, material6);
        createScenario3_InstallmentIssue(customer3, project2, consultant, customerService, material2, material3);
        createScenario4_Completed(customer4, project4, consultant, doctorAssistant, customerService, material4);
        createScenario5_PendingMaterial(customer1, project5, consultant, doctorAssistant);

        createExportTaskSamples();

        log.info("种子数据初始化完成！");
    }

    private Employee createEmployee(String name, String username, RoleType role, String desc) {
        Employee emp = Employee.builder()
                .name(name)
                .username(username)
                .phone("1380000" + String.format("%04d", (int) (Math.random() * 10000)))
                .role(role)
                .description(desc)
                .build();
        return employeeRepository.save(emp);
    }

    private Customer createCustomer(String name, String phone, String gender, LocalDate birthday, String medical, String allergy) {
        Customer customer = Customer.builder()
                .name(name)
                .phone(phone)
                .gender(gender)
                .birthday(birthday)
                .idCard("110101" + birthday.toString().replace("-", "") + String.format("%04d", (int) (Math.random() * 10000)))
                .medicalHistory(medical)
                .allergyHistory(allergy)
                .remark("VIP客户，注重服务体验")
                .build();
        return customerRepository.save(customer);
    }

    private Project createProject(String name, String category, BigDecimal price, String desc, String contra, String recovery, String risk, int duration, boolean active) {
        Project project = Project.builder()
                .name(name)
                .category(category)
                .basePrice(price)
                .description(desc)
                .contraindication(contra)
                .recoveryPeriod(recovery)
                .riskWarning(risk)
                .estimatedDuration(duration)
                .active(active)
                .build();
        return projectRepository.save(project);
    }

    private Material createMaterial(String name, String category, String spec, String batch, LocalDate prod, LocalDate expiry, String manu, BigDecimal price, int stock, String storage, MaterialStatus status) {
        Material material = Material.builder()
                .name(name)
                .category(category)
                .specification(spec)
                .batchNumber(batch)
                .productionDate(prod)
                .expiryDate(expiry)
                .manufacturer(manu)
                .unitPrice(price)
                .stockQuantity(stock)
                .storageCondition(storage)
                .status(status)
                .build();
        return materialRepository.save(material);
    }

    @Transactional
    public void createScenario1_PromiseInconsistency(Customer customer, Project project, Employee consultant, Employee assistant, Employee doctor,
                                                 Material matSilicone, Material matSuture, Material matSponge) {
        log.info("创建场景1：承诺口径不一致问题");

        CustomerProject cp = CustomerProject.builder()
                .customer(customer)
                .project(project)
                .consultant(consultant)
                .doctor(doctor)
                .doctorAssistant(assistant)
                .status(ProjectStatus.CONFIRMED)
                .quotedPrice(new BigDecimal("18800"))
                .finalPrice(new BigDecimal("16800"))
                .scheduledTime(LocalDateTime.now().plusDays(3))
                .operatingRoom("手术室A")
                .treatmentPlan("韩式生科三段式假体植入，配合耳软骨修饰鼻尖")
                .promiseContent("承诺术后7天消肿，1个月恢复自然，终身质保假体")
                .preOperationNote("术前8小时禁食禁水，避开月经期")
                .postOperationNote("术后冷敷3天，7天拆线，忌口辛辣刺激")
                .internalRemark("客户对价格敏感，已争取优惠2000元")
                .build();
        cp = customerProjectRepository.save(cp);

        historyNoteService.addConsultationNote(cp.getId(),
                "客户首次到店咨询，希望改善鼻梁偏低问题，倾向于自然款隆鼻。" +
                "咨询师介绍了硅胶假体和肋软骨两种方案，客户担心取肋软骨疼痛，选择硅胶方案。");

        historyNoteService.addNote(cp.getId(), "QUOTATION", "方案报价",
                "初步报价18800元，包含假体、手术费、麻醉费、术后复查。" +
                "客户表示预算有限，希望再优惠一些。",
                "quotedPrice", null, "18800", null);

        historyNoteService.addPromiseNote(cp.getId(), null,
                "承诺术后7天基本消肿，不影响正常上班；1个月恢复自然；" +
                "假体终身质保，5年内免费调整。客户表示满意。");

        historyNoteService.addNote(cp.getId(), "PRICE_CHANGE", "价格调整",
                "经请示店长，同意给到客户优惠价16800元，客户当场支付定金5000元。",
                "finalPrice", "18800", "16800",
                "优惠申请：店长特批，客户是老客户介绍");

        historyNoteService.addScheduleNote(cp.getId(),
                String.format("排期时间：%s，手术室：%s，主刀医生：%s，助理：%s。" +
                        "已告知客户术前注意事项，客户确认无误。",
                        cp.getScheduledTime(), cp.getOperatingRoom(),
                        doctor.getName(), assistant.getName()));

        historyNoteService.addNote(cp.getId(), "INTERNAL", "内部沟通",
                "术前沟通会确认：医生助理提出，该假体承诺的7天消肿是理想状态，" +
                "实际根据个人体质可能需要10-14天。请咨询师与客户同步，避免预期过高。",
                null, null, null,
                "重要：咨询师需要调整客户预期，避免术后纠纷");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONSULTING.getDisplayName(),
                ProjectStatus.QUOTED.getDisplayName(),
                "客户确认方案和报价");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.QUOTED.getDisplayName(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                "客户支付定金，确认手术时间");

        Order order = Order.builder()
                .orderNo("ORD20260601001")
                .customerProject(cp)
                .totalAmount(new BigDecimal("16800"))
                .depositAmount(new BigDecimal("5000"))
                .paidAmount(new BigDecimal("5000"))
                .remainingAmount(new BigDecimal("11800"))
                .installment(false)
                .paymentStatus(PaymentStatus.DEPOSIT_PAID)
                .depositDueDate(LocalDateTime.now().minusDays(1))
                .paymentTerms("术前付清尾款11800元")
                .remark("店长特批优惠价")
                .build();
        orderRepository.save(order);

        historyNoteService.addPaymentNote(cp.getId(),
                "定金5000元已到账，尾款11800元术前支付。");

        log.info("场景1创建完成 - 项目ID: {}", cp.getId());
    }

    @Transactional
    public void createScenario2_PostoperativeComplaint(Customer customer, Project project, Employee consultant,
                                                       Employee assistant, Employee cs, Employee doctor,
                                                       Material matSuture, Material matSwellingPatch) {
        log.info("创建场景2：术后投诉处理");

        CustomerProject cp = CustomerProject.builder()
                .customer(customer)
                .project(project)
                .consultant(consultant)
                .doctor(doctor)
                .doctorAssistant(assistant)
                .status(ProjectStatus.COMPLAINT)
                .quotedPrice(new BigDecimal("12800"))
                .finalPrice(new BigDecimal("12800"))
                .scheduledTime(LocalDateTime.now().minusDays(10))
                .operatingRoom("手术室B")
                .treatmentPlan("全切双眼皮，开内眼角，去皮去脂")
                .promiseContent("承诺术后3个月完全自然，无痕，两侧对称")
                .preOperationNote("术前检查正常，无手术禁忌")
                .postOperationNote("术后第2天换药，第7天拆线，多做睁眼运动")
                .internalRemark("客户术后第5天反映两侧不对称，已安排复诊")
                .build();
        cp = customerProjectRepository.save(cp);

        historyNoteService.addConsultationNote(cp.getId(),
                "客户内双，希望做全切双眼皮改善眼型。" +
                "咨询师建议配合开内眼角，效果更佳。客户同意。");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONSULTING.getDisplayName(),
                ProjectStatus.QUOTED.getDisplayName(),
                "方案确定，报价12800元");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.QUOTED.getDisplayName(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                "客户付全款，确认手术");

        historyNoteService.addScheduleNote(cp.getId(),
                String.format("手术时间：%s，手术室B，陈医生主刀。" +
                        "术前画线设计已确认，客户表示喜欢自然款。",
                        cp.getScheduledTime()));

        MaterialReservation mr1 = MaterialReservation.builder()
                .customerProject(cp)
                .material(matSuture)
                .quantity(2)
                .status(MaterialStatus.USED)
                .reservedAt(LocalDateTime.now().minusDays(11))
                .usedAt(LocalDateTime.now().minusDays(10))
                .reservedBy(assistant)
                .remark("手术使用")
                .build();
        materialReservationRepository.save(mr1);

        MaterialReservation mr2 = MaterialReservation.builder()
                .customerProject(cp)
                .material(matSwellingPatch)
                .quantity(1)
                .status(MaterialStatus.USED)
                .reservedAt(LocalDateTime.now().minusDays(11))
                .usedAt(LocalDateTime.now().minusDays(10))
                .reservedBy(assistant)
                .remark("术后消肿贴")
                .build();
        materialReservationRepository.save(mr2);

        historyNoteService.addMaterialNote(cp.getId(), "可吸收缝合线", 2, "已预留");
        historyNoteService.addMaterialNote(cp.getId(), "消肿止痛贴", 1, "已预留");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                ProjectStatus.SCHEDULED.getDisplayName(),
                "手术已排期");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.SCHEDULED.getDisplayName(),
                ProjectStatus.MATERIAL_RESERVED.getDisplayName(),
                "耗材已预留");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.MATERIAL_RESERVED.getDisplayName(),
                ProjectStatus.IN_PROGRESS.getDisplayName(),
                "手术开始");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.IN_PROGRESS.getDisplayName(),
                ProjectStatus.COMPLETED.getDisplayName(),
                "手术顺利完成，时长约90分钟");

        FollowUpRecord followUp1 = FollowUpRecord.builder()
                .customerProject(cp)
                .followUpType("术后第1天")
                .followUpTime(LocalDateTime.now().minusDays(9))
                .followedBy(cs)
                .customerCondition("肿胀明显，有轻微疼痛，属于正常术后反应")
                .guidance("继续冷敷，避免碰水，按时吃药")
                .customerFeedback("客户表示疼痛可以忍受，担心消肿太慢")
                .satisfactionScore(4)
                .nextStep("术后第3天换药复诊")
                .nextFollowUpTime(LocalDateTime.now().minusDays(7))
                .build();
        followUpRecordRepository.save(followUp1);

        historyNoteService.addFollowUpNote(cp.getId(),
                "术后第1天回访：客户肿胀明显，已安抚属正常现象，指导冷敷方法。");

        FollowUpRecord followUp2 = FollowUpRecord.builder()
                .customerProject(cp)
                .followUpType("术后第5天")
                .followUpTime(LocalDateTime.now().minusDays(5))
                .followedBy(cs)
                .customerCondition("客户发现两侧眼睛消肿速度不一样，感觉宽度不一致")
                .guidance("建议多做睁眼运动，消肿后再观察，建议来院复诊")
                .customerFeedback("客户很焦虑，担心手术失败，要求赔偿")
                .satisfactionScore(1)
                .nextStep("已预约明天上午10点复诊")
                .nextFollowUpTime(LocalDateTime.now().minusDays(4))
                .build();
        followUpRecordRepository.save(followUp2);

        historyNoteService.addFollowUpNote(cp.getId(),
                "术后第5天：客户反映两侧不对称，情绪激动，已安排复诊。");

        Complaint complaint = Complaint.builder()
                .customerProject(cp)
                .title("双眼皮术后两侧不对称")
                .content("术后第5天，发现两侧双眼皮宽度明显不一样，左眼宽右眼窄。" +
                        "术前承诺两侧对称，但现在明显不对称，严重影响美观。" +
                        "要求医院给出解决方案，否则要求退款并赔偿精神损失。")
                .complaintType("术后效果")
                .status(ComplaintStatus.PROCESSING)
                .handledBy(cs)
                .handledAt(LocalDateTime.now().minusDays(4))
                .handlingResult("已安排主刀医生复诊，医生检查后认为目前仍在肿胀期，" +
                        "两侧消肿速度不同是正常现象。已拍摄对比照片，" +
                        "承诺术后1个月如果仍不对称，免费进行调整修复。")
                .customerFeedback("客户勉强同意先观察，但要求签署书面承诺。")
                .satisfactionScore(3)
                .build();
        complaintRepository.save(complaint);

        historyNoteService.addComplaintNote(cp.getId(),
                "双眼皮术后两侧不对称",
                "已安排复诊，医生解释肿胀期正常现象，承诺1个月后如仍不对称免费修复。");

        historyNoteService.addNote(cp.getId(), "INTERNAL", "内部讨论",
                "下午召开病例讨论会：1. 术前照片对比，设计时确实两侧对称；" +
                "2. 目前肿胀差异明显，建议客户耐心等待；" +
                        "3. 客服持续跟进安抚；4. 如1个月后仍有差异，安排免费修复。",
                null, null, null,
                "重点关注客户情绪，避免升级投诉");

        Order order = Order.builder()
                .orderNo("ORD20260601002")
                .customerProject(cp)
                .totalAmount(new BigDecimal("12800"))
                .depositAmount(new BigDecimal("12800"))
                .paidAmount(new BigDecimal("12800"))
                .remainingAmount(BigDecimal.ZERO)
                .installment(false)
                .paymentStatus(PaymentStatus.FULL_PAID)
                .paymentTerms("术前一次性付清")
                .build();
        orderRepository.save(order);

        historyNoteService.addPaymentNote(cp.getId(), "全款12800元已付清。");

        log.info("场景2创建完成 - 项目ID: {}, 投诉ID: {}", cp.getId(), complaint.getId());
    }

    @Transactional
    public void createScenario3_InstallmentIssue(Customer customer, Project project,
                                                  Employee consultant, Employee cs,
                                                  Material matFatKit, Material matSuture) {
        log.info("创建场景3：分期款项对不上问题");

        CustomerProject cp = CustomerProject.builder()
                .customer(customer)
                .project(project)
                .consultant(consultant)
                .status(ProjectStatus.MATERIAL_RESERVED)
                .quotedPrice(new BigDecimal("35000"))
                .finalPrice(new BigDecimal("32000"))
                .scheduledTime(LocalDateTime.now().plusDays(7))
                .operatingRoom("手术室C")
                .treatmentPlan("大腿内侧吸脂，纯化后填充额头、太阳穴、苹果肌、泪沟")
                .promiseContent("承诺脂肪存活率70%以上，不满意可免费二次填充")
                .preOperationNote("术前2周停止服用阿司匹林等抗凝药")
                .postOperationNote("穿塑身裤1个月，填充部位避免按压")
                .internalRemark("分期12个月，第3期逾期15天未还")
                .build();
        cp = customerProjectRepository.save(cp);

        historyNoteService.addConsultationNote(cp.getId(),
                "客户面部凹陷显老，希望通过自体脂肪填充改善。" +
                "咨询后确定填充额头、太阳穴、苹果肌、泪沟四个部位。");

        historyNoteService.addNote(cp.getId(), "PRICE_NEGOTIATION", "价格协商",
                "报价35000元，客户表示资金紧张，询问能否分期。" +
                        "告知可分期12个月，手续费8%。",
                "quotedPrice", null, "35000", null);

        historyNoteService.addNote(cp.getId(), "PRICE_CHANGE", "最终定价",
                "客户朋友是老客户，介绍过来的，申请到优惠价32000元。" +
                        "分期12个月，首付6400元，每期还款约2240元。",
                "finalPrice", "35000", "32000",
                "老客户介绍优惠3000元，分期12个月");

        historyNoteService.addPromiseNote(cp.getId(), null,
                "承诺脂肪存活率70%以上，如1年后效果不满意，可免费二次填充。" +
                "手术采用最新纳米脂肪移植技术，效果更自然持久。");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONSULTING.getDisplayName(),
                ProjectStatus.QUOTED.getDisplayName(),
                "方案和价格确认");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.QUOTED.getDisplayName(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                "客户支付首付，确认分期方案");

        historyNoteService.addScheduleNote(cp.getId(),
                String.format("手术排期：%s，手术室C。" +
                        "已提醒客户术前注意事项，特别是停药要求。",
                        cp.getScheduledTime()));

        Order order = Order.builder()
                .orderNo("ORD20260601003")
                .customerProject(cp)
                .totalAmount(new BigDecimal("32000"))
                .depositAmount(new BigDecimal("6400"))
                .paidAmount(new BigDecimal("10880"))
                .remainingAmount(new BigDecimal("21120"))
                .installment(true)
                .installmentMonths(12)
                .installmentRate(new BigDecimal("8"))
                .paymentStatus(PaymentStatus.OVERDUE)
                .depositDueDate(LocalDateTime.now().minusDays(20))
                .paymentTerms("首付20%即6400元，余款分12期，每期约2240元，每月10日还款")
                .remark("分期12个月，第3期逾期")
                .build();
        order = orderRepository.save(order);

        InstallmentPlan p1 = InstallmentPlan.builder()
                .order(order).period(1).dueDate(LocalDate.now().minusMonths(2).withDayOfMonth(10))
                .principalAmount(new BigDecimal("2133.33")).interestAmount(new BigDecimal("106.67"))
                .totalAmount(new BigDecimal("2240")).paidAmount(new BigDecimal("2240"))
                .paidDate(LocalDate.now().minusMonths(2).withDayOfMonth(8))
                .status(PaymentStatus.FULL_PAID).build();
        installmentPlanRepository.save(p1);

        InstallmentPlan p2 = InstallmentPlan.builder()
                .order(order).period(2).dueDate(LocalDate.now().minusMonths(1).withDayOfMonth(10))
                .principalAmount(new BigDecimal("2133.33")).interestAmount(new BigDecimal("106.67"))
                .totalAmount(new BigDecimal("2240")).paidAmount(new BigDecimal("2240"))
                .paidDate(LocalDate.now().minusMonths(1).withDayOfMonth(12))
                .status(PaymentStatus.FULL_PAID).build();
        installmentPlanRepository.save(p2);

        InstallmentPlan p3 = InstallmentPlan.builder()
                .order(order).period(3).dueDate(LocalDate.now().withDayOfMonth(10).minusDays(15))
                .principalAmount(new BigDecimal("2133.34")).interestAmount(new BigDecimal("106.66"))
                .totalAmount(new BigDecimal("2240")).paidAmount(BigDecimal.ZERO)
                .status(PaymentStatus.OVERDUE)
                .remark("已逾期15天，电话催收2次，客户称资金周转困难，承诺月底前还款").build();
        installmentPlanRepository.save(p3);

        for (int i = 4; i <= 12; i++) {
            BigDecimal principal = i == 12 ? new BigDecimal("2133.36") : new BigDecimal("2133.33");
            BigDecimal interest = i == 12 ? new BigDecimal("106.64") : new BigDecimal("106.67");
            InstallmentPlan plan = InstallmentPlan.builder()
                    .order(order).period(i).dueDate(LocalDate.now().withDayOfMonth(10).plusMonths(i - 3))
                    .principalAmount(principal).interestAmount(interest)
                    .totalAmount(principal.add(interest)).paidAmount(BigDecimal.ZERO)
                    .status(PaymentStatus.UNPAID).build();
            installmentPlanRepository.save(plan);
        }

        orderService.updateOrderPaymentStatus(order);

        historyNoteService.addPaymentNote(cp.getId(),
                "首付6400元已到账。分期12个月，每月10日还款2240元。");

        historyNoteService.addPaymentNote(cp.getId(),
                "第1期2240元已按时到账（8日还款，提前2天）。");

        historyNoteService.addPaymentNote(cp.getId(),
                "第2期2240元已到账（12日还款，逾期2天，客户称忘记还款日期）。");

        historyNoteService.addNote(cp.getId(), "PAYMENT_WARNING", "逾期提醒",
                "第3期还款日期6月10日，已逾期15天。已电话联系客户2次，" +
                        "客户称最近生意周转困难，承诺6月30日前还款。" +
                        "已发送短信和微信提醒。",
                null, null, null,
                "重点关注，月底前再次跟进，如仍未还款考虑上门催收");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                ProjectStatus.SCHEDULED.getDisplayName(),
                "手术已排期");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.SCHEDULED.getDisplayName(),
                ProjectStatus.MATERIAL_RESERVED.getDisplayName(),
                "耗材已预留，等待手术");

        MaterialReservation mr1 = MaterialReservation.builder()
                .customerProject(cp)
                .material(matFatKit)
                .quantity(1)
                .status(MaterialStatus.RESERVED)
                .reservedAt(LocalDateTime.now().minusDays(2))
                .reservedBy(consultant)
                .remark("等待手术使用")
                .build();
        materialReservationRepository.save(mr1);

        MaterialReservation mr2 = MaterialReservation.builder()
                .customerProject(cp)
                .material(matSuture)
                .quantity(3)
                .status(MaterialStatus.RESERVED)
                .reservedAt(LocalDateTime.now().minusDays(2))
                .reservedBy(consultant)
                .remark("等待手术使用")
                .build();
        materialReservationRepository.save(mr2);

        historyNoteService.addMaterialNote(cp.getId(), "自体脂肪处理套件", 1, "已预留");
        historyNoteService.addMaterialNote(cp.getId(), "可吸收缝合线", 3, "已预留");

        log.info("场景3创建完成 - 项目ID: {}, 订单ID: {}", cp.getId(), order.getId());
    }

    @Transactional
    public void createScenario4_Completed(Customer customer, Project project, Employee consultant,
                                          Employee assistant, Employee cs,
                                          Material matHyaluronicAcid) {
        log.info("创建场景4：已完成项目（全流程闭环示例）");

        CustomerProject cp = CustomerProject.builder()
                .customer(customer)
                .project(project)
                .consultant(consultant)
                .doctorAssistant(assistant)
                .status(ProjectStatus.FOLLOWED_UP)
                .quotedPrice(new BigDecimal("6800"))
                .finalPrice(new BigDecimal("6800"))
                .scheduledTime(LocalDateTime.now().minusDays(20))
                .operatingRoom("微整形室A")
                .treatmentPlan("乔雅登玻尿酸注射丰唇，1ml")
                .promiseContent("承诺效果维持6-8个月，如有硬结及时复诊")
                .preOperationNote("唇部无疱疹，避开经期")
                .postOperationNote("术后6小时内避免沾水，1周内忌口辛辣")
                .internalRemark("客户非常满意，已介绍2位朋友到店")
                .build();
        cp = customerProjectRepository.save(cp);

        historyNoteService.addConsultationNote(cp.getId(),
                "客户觉得嘴唇偏薄，希望更饱满性感。推荐乔雅登玻尿酸，效果自然持久。");

        historyNoteService.addPromiseNote(cp.getId(), null,
                "承诺使用正品乔雅登玻尿酸，当场验货，效果维持6-8个月。" +
                "如出现红肿硬结等异常，免费复诊处理。");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONSULTING.getDisplayName(),
                ProjectStatus.QUOTED.getDisplayName(),
                "方案确定，报价6800元");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.QUOTED.getDisplayName(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                "客户付全款，安排当天注射");

        MaterialReservation mr = MaterialReservation.builder()
                .customerProject(cp)
                .material(matHyaluronicAcid)
                .quantity(1)
                .status(MaterialStatus.USED)
                .reservedAt(LocalDateTime.now().minusDays(20))
                .usedAt(LocalDateTime.now().minusDays(20))
                .reservedBy(assistant)
                .remark("当场使用，客户已验货")
                .build();
        materialReservationRepository.save(mr);

        historyNoteService.addMaterialNote(cp.getId(), "玻尿酸（乔雅登）", 1, "已使用");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                ProjectStatus.SCHEDULED.getDisplayName(),
                "安排当天下午注射");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.SCHEDULED.getDisplayName(),
                ProjectStatus.MATERIAL_RESERVED.getDisplayName(),
                "玻尿酸已验货，准备注射");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.MATERIAL_RESERVED.getDisplayName(),
                ProjectStatus.IN_PROGRESS.getDisplayName(),
                "开始注射，约30分钟完成");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.IN_PROGRESS.getDisplayName(),
                ProjectStatus.COMPLETED.getDisplayName(),
                "注射完成，效果满意，客户当场拍照确认");

        Order order = Order.builder()
                .orderNo("ORD20260601004")
                .customerProject(cp)
                .totalAmount(new BigDecimal("6800"))
                .depositAmount(new BigDecimal("6800"))
                .paidAmount(new BigDecimal("6800"))
                .remainingAmount(BigDecimal.ZERO)
                .installment(false)
                .paymentStatus(PaymentStatus.FULL_PAID)
                .paymentTerms("一次性付清")
                .build();
        orderRepository.save(order);

        historyNoteService.addPaymentNote(cp.getId(), "全款6800元已付清，微信支付。");

        FollowUpRecord followUp1 = FollowUpRecord.builder()
                .customerProject(cp)
                .followUpType("术后第3天")
                .followUpTime(LocalDateTime.now().minusDays(17))
                .followedBy(cs)
                .customerCondition("轻微肿胀，不影响正常生活，客户很满意")
                .guidance("继续忌口，避免按压唇部")
                .customerFeedback("效果很好，朋友都说自然，已推荐2位朋友咨询")
                .satisfactionScore(5)
                .nextStep("术后1个月再回访")
                .nextFollowUpTime(LocalDateTime.now().minusDays(5))
                .build();
        followUpRecordRepository.save(followUp1);

        FollowUpRecord followUp2 = FollowUpRecord.builder()
                .customerProject(cp)
                .followUpType("术后1个月")
                .followUpTime(LocalDateTime.now().minusDays(5))
                .followedBy(cs)
                .customerCondition("完全消肿，形态自然，客户非常满意")
                .guidance("正常生活即可，6个月后可考虑补打")
                .customerFeedback("已经推荐2位朋友到店，其中一位已经付定金做隆鼻")
                .satisfactionScore(5)
                .nextStep("6个月后回访补打意向")
                .nextFollowUpTime(LocalDateTime.now().plusMonths(5))
                .build();
        followUpRecordRepository.save(followUp2);

        historyNoteService.addFollowUpNote(cp.getId(),
                "术后1个月回访：客户非常满意，已成功转介绍2位客户，给予VIP升级。");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.COMPLETED.getDisplayName(),
                ProjectStatus.FOLLOWED_UP.getDisplayName(),
                "术后回访全部完成，客户满意度5分");

        historyNoteService.addNote(cp.getId(), "INTERNAL", "客户升级",
                "客户满意度高，成功转介绍，升级为VIP客户，下次消费享受9折优惠。",
                null, null, null,
                "优质客户，重点维护");

        log.info("场景4创建完成 - 项目ID: {}", cp.getId());
    }

    @Transactional
    public void createScenario5_PendingMaterial(Customer customer, Project project,
                                                 Employee consultant, Employee assistant) {
        log.info("创建场景5：已排期未预留耗材（空档预警示例）");

        CustomerProject cp = CustomerProject.builder()
                .customer(customer)
                .project(project)
                .consultant(consultant)
                .status(ProjectStatus.SCHEDULED)
                .quotedPrice(new BigDecimal("58000"))
                .finalPrice(new BigDecimal("58000"))
                .scheduledTime(LocalDateTime.now().plusDays(5))
                .operatingRoom("手术室D（大手术室）")
                .treatmentPlan("下颌角长曲线截骨，下颌骨外板打磨")
                .promiseContent("承诺术后3-6个月恢复自然，侧面线条流畅")
                .preOperationNote("需住院3天，术前需做全面体检，备血200ml")
                .postOperationNote("术后需插引流管2天，流质饮食1周")
                .internalRemark("⚠️ 警告：已排期但耗材尚未预留，存在空档风险！")
                .build();
        cp = customerProjectRepository.save(cp);

        historyNoteService.addConsultationNote(cp.getId(),
                "客户对下颌角宽大不满意，希望做轮廓手术改善脸型。" +
                "已详细告知手术风险，客户表示理解并坚持手术。");

        historyNoteService.addNote(cp.getId(), "RISK_DISCLOSURE", "风险告知",
                "已充分告知下颌角截骨手术风险：出血、感染、神经损伤、" +
                "两侧不对称、效果不满意等。客户已签署手术知情同意书。",
                null, null, null,
                "四级手术，必须确认所有准备工作到位");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONSULTING.getDisplayName(),
                ProjectStatus.QUOTED.getDisplayName(),
                "方案确定，报价58000元");

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.QUOTED.getDisplayName(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                "客户支付定金20000元，确认手术时间");

        historyNoteService.addScheduleNote(cp.getId(),
                String.format("⚠️ 重要提醒：手术已排期至 %s，手术室D。" +
                        "但耗材尚未预留！！！请医生助理尽快处理，避免手术当天缺料。",
                        cp.getScheduledTime()));

        historyNoteService.addStatusChangeNote(cp.getId(),
                ProjectStatus.CONFIRMED.getDisplayName(),
                ProjectStatus.SCHEDULED.getDisplayName(),
                "手术已排期，等待耗材预留");

        historyNoteService.addNote(cp.getId(), "WARNING", "空档预警",
                "⚠️ 系统检测：项目已排期但耗材预留尚未完成，" +
                        "距离手术还有5天。请医生助理立即处理，避免出现空档无人负责。",
                null, null, null,
                "高优先级！如耗材不足可能需要推迟手术");

        Order order = Order.builder()
                .orderNo("ORD20260601005")
                .customerProject(cp)
                .totalAmount(new BigDecimal("58000"))
                .depositAmount(new BigDecimal("20000"))
                .paidAmount(new BigDecimal("20000"))
                .remainingAmount(new BigDecimal("38000"))
                .installment(false)
                .paymentStatus(PaymentStatus.DEPOSIT_PAID)
                .paymentTerms("术前付清余款38000元")
                .remark("四级手术，定金不退")
                .build();
        orderRepository.save(order);

        historyNoteService.addPaymentNote(cp.getId(), "定金20000元已到账，术前需付清尾款。");

        log.info("场景5创建完成 - 项目ID: {}, 状态：已排期未预留耗材（空档预警）", cp.getId());
    }

    @Transactional
    public void createExportTaskSamples() {
        log.info("创建导出任务样例数据...");

        ExportTask task1 = ExportTask.builder()
                .exportType(ExportType.PROJECTS)
                .status(ExportTaskStatus.COMPLETED)
                .filterCriteria("{\"startDate\":\"2026-06-01\",\"endDate\":\"2026-06-30\",\"status\":\"SCHEDULED\"}")
                .fileName("项目排期表_20260601.xlsx")
                .fileSize(24576L)
                .startedAt(LocalDateTime.now().minusHours(2))
                .completedAt(LocalDateTime.now().minusHours(2).plusMinutes(3))
                .recordCount(15)
                .remark("客服王导出6月份排期表")
                .build();
        exportTaskRepository.save(task1);

        ExportTask task2 = ExportTask.builder()
                .exportType(ExportType.ORDERS)
                .status(ExportTaskStatus.COMPLETED)
                .filterCriteria("{\"exportType\":\"orders\",\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-31\"}")
                .fileName("分期款项明细_202605.xlsx")
                .fileSize(32768L)
                .startedAt(LocalDateTime.now().minusDays(5))
                .completedAt(LocalDateTime.now().minusDays(5).plusMinutes(2))
                .recordCount(42)
                .remark("财务对账使用")
                .build();
        exportTaskRepository.save(task2);

        ExportTask task3 = ExportTask.builder()
                .exportType(ExportType.MATERIALS)
                .status(ExportTaskStatus.PROCESSING)
                .filterCriteria("{\"startDate\":\"2026-06-01\"}")
                .fileName("耗材预留记录_近一月.xlsx")
                .startedAt(LocalDateTime.now().minusMinutes(1))
                .remark("正在生成本月耗材使用统计")
                .build();
        exportTaskRepository.save(task3);

        ExportTask task4 = ExportTask.builder()
                .exportType(ExportType.ORDERS)
                .status(ExportTaskStatus.FAILED)
                .filterCriteria("{\"exportType\":\"orders\",\"includeFields\":\"all\"}")
                .fileName("分期款项明细_失败.xlsx")
                .startedAt(LocalDateTime.now().minusHours(5))
                .completedAt(LocalDateTime.now().minusHours(5).plusSeconds(30))
                .errorMessage("java.lang.OutOfMemoryError: GC overhead limit exceeded")
                .errorStackTrace("java.lang.OutOfMemoryError: GC overhead limit exceeded\n\tat org.apache.poi.xssf.usermodel.XSSFWorkbook.<init>(XSSFWorkbook.java:231)\n\t...")
                .remark("大文件导出超时失败，建议分批次导出")
                .build();
        exportTaskRepository.save(task4);

        ExportTask task5 = ExportTask.builder()
                .exportType(ExportType.PROJECTS)
                .status(ExportTaskStatus.PENDING)
                .filterCriteria("{\"status\":\"COMPLETED\",\"startDate\":\"2026-01-01\",\"endDate\":\"2026-06-30\"}")
                .fileName("上半年已完成项目统计.xlsx")
                .remark("排队中，预计执行时间30秒")
                .build();
        exportTaskRepository.save(task5);

        log.info("导出任务样例创建完成 - 共5条任务：2条已完成、1条处理中、1条失败、1条待处理");
    }
}
