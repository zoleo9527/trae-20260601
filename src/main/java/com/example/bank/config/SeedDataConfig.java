package com.example.bank.config;

import com.example.bank.entity.Appointment;
import com.example.bank.entity.HistoryRecord;
import com.example.bank.entity.User;
import com.example.bank.enums.AppointmentStatus;
import com.example.bank.enums.BusinessType;
import com.example.bank.enums.RoleType;
import com.example.bank.repository.AppointmentRepository;
import com.example.bank.repository.HistoryRecordRepository;
import com.example.bank.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class SeedDataConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final HistoryRecordRepository historyRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            createSeedUsers();
        }

        if (appointmentRepository.count() == 0) {
            createSeedAppointments();
        }
    }

    private void createSeedUsers() {
        User lobbyManager = User.builder()
                .username("lobby001")
                .password(passwordEncoder.encode("123456"))
                .realName("王明")
                .role(RoleType.LOBBY_MANAGER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        User accountManager = User.builder()
                .username("account001")
                .password(passwordEncoder.encode("123456"))
                .realName("李芳")
                .role(RoleType.ACCOUNT_MANAGER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        User operationSupervisor = User.builder()
                .username("supervisor001")
                .password(passwordEncoder.encode("123456"))
                .realName("张经理")
                .role(RoleType.OPERATION_SUPERVISOR)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.saveAll(Arrays.asList(lobbyManager, accountManager, operationSupervisor));
    }

    private void createSeedAppointments() {
        LocalDateTime now = LocalDateTime.now();

        Appointment appt1 = Appointment.builder()
                .appointmentNo("APPT2024010001")
                .customerName("陈小明")
                .customerId("440301199001011234")
                .customerPhone("13812345678")
                .businessType(BusinessType.LOAN_APPLICATION)
                .status(AppointmentStatus.PENDING)
                .appointmentTime(now.plusHours(1))
                .urgentLevel(3)
                .remarks("首次办理贷款业务，需要详细咨询")
                .createdAt(now.minusHours(2))
                .build();

        Appointment appt2 = Appointment.builder()
                .appointmentNo("APPT2024010002")
                .customerName("林小红")
                .customerId("310101198506156789")
                .customerPhone("13987654321")
                .businessType(BusinessType.PERSONAL_ACCOUNT_OPENING)
                .status(AppointmentStatus.CHECKED_IN)
                .appointmentTime(now.minusHours(1))
                .checkInTime(now.minusMinutes(30))
                .estimatedWaitTime(25)
                .urgentLevel(2)
                .remarks("新客户开户，需要开通网银")
                .createdAt(now.minusHours(3))
                .build();

        Appointment appt3 = Appointment.builder()
                .appointmentNo("APPT2024010003")
                .customerName("王大力")
                .customerId("110101197803201111")
                .customerPhone("13611112222")
                .businessType(BusinessType.INVESTMENT_CONSULTATION)
                .status(AppointmentStatus.MATERIAL_INCOMPLETE)
                .appointmentTime(now.minusHours(2))
                .checkInTime(now.minusHours(1).minusMinutes(30))
                .startProcessTime(now.minusMinutes(45))
                .assignedUserId(2L)
                .windowNo("2号窗口")
                .materialStatus("资料缺页: 收入证明原件、资产证明文件、配偶身份证复印件")
                .urgentLevel(4)
                .remarks("客户表示急需办理，承诺下午补齐资料; 客户情绪较为焦急")
                .createdAt(now.minusHours(4))
                .build();

        Appointment appt4 = Appointment.builder()
                .appointmentNo("APPT2024010004")
                .customerName("赵小云")
                .customerId("210101199212123333")
                .customerPhone("13544445555")
                .businessType(BusinessType.LOAN_APPLICATION)
                .status(AppointmentStatus.DUE_DILIGENCE_PENDING)
                .appointmentTime(now.minusHours(3))
                .checkInTime(now.minusHours(2).minusMinutes(15))
                .startProcessTime(now.minusHours(1).minusMinutes(30))
                .assignedUserId(2L)
                .windowNo("3号窗口")
                .dueDiligenceStatus("尽调待补: 工作单位证明、近6个月银行流水、征信授权书")
                .urgentLevel(3)
                .remarks("贷款金额较大，需要补充尽调材料; 已联系单位人事部门")
                .createdAt(now.minusHours(5))
                .build();

        Appointment appt5 = Appointment.builder()
                .appointmentNo("APPT2024010005")
                .customerName("孙大伟")
                .customerId("330101198808084444")
                .customerPhone("13766667777")
                .businessType(BusinessType.CARD_REPLACEMENT)
                .status(AppointmentStatus.COMPLAINT_RECORDED)
                .appointmentTime(now.minusHours(4))
                .checkInTime(now.minusHours(3).minusMinutes(10))
                .startProcessTime(now.minusHours(2))
                .assignedUserId(2L)
                .windowNo("1号窗口")
                .complaintStatus("投诉: 业务处理超时，等待超过2小时，客户情绪激动")
                .urgentLevel(5)
                .remarks("客户情绪激动，要求优先处理; 已上报运营主管; 等待主管协调处理")
                .createdAt(now.minusHours(6))
                .build();

        Appointment appt6 = Appointment.builder()
                .appointmentNo("APPT2024010006")
                .customerName("周小丽")
                .customerId("420101199505055555")
                .customerPhone("13888889999")
                .businessType(BusinessType.FOREIGN_EXCHANGE)
                .status(AppointmentStatus.PROCESSING)
                .appointmentTime(now.minusHours(1))
                .checkInTime(now.minusMinutes(45))
                .startProcessTime(now.minusMinutes(30))
                .assignedUserId(2L)
                .windowNo("4号窗口")
                .urgentLevel(2)
                .remarks("外汇购汇业务，金额较大，需要主管审批")
                .createdAt(now.minusHours(2))
                .build();

        Appointment appt7 = Appointment.builder()
                .appointmentNo("APPT2024010007")
                .customerName("吴志强")
                .customerId("430101198011116666")
                .customerPhone("13900001111")
                .businessType(BusinessType.ACCOUNT_CLOSURE)
                .status(AppointmentStatus.COMPLETED)
                .appointmentTime(now.minusHours(5))
                .checkInTime(now.minusHours(5).minusMinutes(5))
                .startProcessTime(now.minusHours(4).minusMinutes(50))
                .completeTime(now.minusHours(4))
                .assignedUserId(2L)
                .windowNo("2号窗口")
                .actualProcessTime(50)
                .urgentLevel(1)
                .remarks("业务办理顺利，客户满意")
                .createdAt(now.minusHours(6))
                .build();

        Appointment appt8 = Appointment.builder()
                .appointmentNo("APPT2024010008")
                .customerName("郑美华")
                .customerId("350101199003037777")
                .customerPhone("13622223333")
                .businessType(BusinessType.LOAN_APPLICATION)
                .status(AppointmentStatus.COMPLETED)
                .appointmentTime(now.minusDays(1).minusHours(2))
                .checkInTime(now.minusDays(1).minusHours(2).plusMinutes(10))
                .startProcessTime(now.minusDays(1).minusHours(1).minusMinutes(40))
                .completeTime(now.minusDays(1).minusHours(1))
                .assignedUserId(2L)
                .windowNo("3号窗口")
                .materialStatus("已补全: 收入证明、工作证明")
                .actualProcessTime(40)
                .urgentLevel(3)
                .remarks("资料缺页后补齐完成; 客户下午补交资料后顺利完成")
                .createdAt(now.minusDays(1).minusHours(3))
                .build();

        Appointment appt9 = Appointment.builder()
                .appointmentNo("APPT2024010009")
                .customerName("刘建国")
                .customerId("510101198512128888")
                .customerPhone("13555556666")
                .businessType(BusinessType.INVESTMENT_CONSULTATION)
                .status(AppointmentStatus.COMPLETED)
                .appointmentTime(now.minusDays(2).minusHours(3))
                .checkInTime(now.minusDays(2).minusHours(3).plusMinutes(5))
                .startProcessTime(now.minusDays(2).minusHours(2).minusMinutes(50))
                .completeTime(now.minusDays(2).minusHours(2))
                .assignedUserId(2L)
                .windowNo("2号窗口")
                .dueDiligenceStatus("已完成: 风险评估问卷、投资经验证明")
                .actualProcessTime(55)
                .urgentLevel(2)
                .remarks("尽调补件后完成; 客户次日补交材料后顺利办理")
                .createdAt(now.minusDays(2).minusHours(4))
                .build();

        Appointment appt10 = Appointment.builder()
                .appointmentNo("APPT2024010010")
                .customerName("张秀英")
                .customerId("610101197909099999")
                .customerPhone("13877778888")
                .businessType(BusinessType.CARD_REPLACEMENT)
                .status(AppointmentStatus.COMPLETED)
                .appointmentTime(now.minusDays(3).minusHours(1))
                .checkInTime(now.minusDays(3).minusHours(1).plusMinutes(8))
                .startProcessTime(now.minusDays(3).minusMinutes(45))
                .completeTime(now.minusDays(3).minusMinutes(15))
                .assignedUserId(2L)
                .windowNo("1号窗口")
                .complaintStatus("已处理: 致歉并优先办理，赠送小礼品安抚客户情绪")
                .actualProcessTime(30)
                .urgentLevel(5)
                .remarks("投诉处理后完成; 客户对处理结果表示满意")
                .createdAt(now.minusDays(3).minusHours(2))
                .build();

        appointmentRepository.saveAll(Arrays.asList(appt1, appt2, appt3, appt4, appt5, appt6, appt7, appt8, appt9, appt10));

        createHistoryRecords();
    }

    private void createHistoryRecords() {
        LocalDateTime now = LocalDateTime.now();

        HistoryRecord record1_1 = HistoryRecord.builder()
                .appointmentId(1L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户通过手机银行预约贷款申请业务，预约时间: " + now.plusHours(1).toString())
                .createdAt(now.minusHours(2))
                .build();

        HistoryRecord record2_1 = HistoryRecord.builder()
                .appointmentId(2L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("大堂经理协助客户预约个人开户业务")
                .createdAt(now.minusHours(3))
                .build();

        HistoryRecord record2_2 = HistoryRecord.builder()
                .appointmentId(2L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 25分钟，前方排队: 3人")
                .createdAt(now.minusMinutes(30))
                .build();

        HistoryRecord record3_1 = HistoryRecord.builder()
                .appointmentId(3L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户现场预约理财咨询业务，表示有较大金额投资意向")
                .createdAt(now.minusHours(4))
                .build();

        HistoryRecord record3_2 = HistoryRecord.builder()
                .appointmentId(3L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 20分钟")
                .createdAt(now.minusHours(1).minusMinutes(30))
                .build();

        HistoryRecord record3_3 = HistoryRecord.builder()
                .appointmentId(3L)
                .action("ASSIGN")
                .actionName("分配窗口")
                .detail("大堂经理王明分配给客户经理李芳，窗口: 2号窗口")
                .createdAt(now.minusHours(1).minusMinutes(25))
                .build();

        HistoryRecord record3_4 = HistoryRecord.builder()
                .appointmentId(3L)
                .action("START_PROCESS")
                .actionName("开始处理")
                .detail("客户经理李芳开始为客户办理理财咨询业务")
                .createdAt(now.minusMinutes(45))
                .build();

        HistoryRecord record3_5 = HistoryRecord.builder()
                .appointmentId(3L)
                .action("MATERIAL_INCOMPLETE")
                .actionName("资料缺页待补")
                .detail("缺失资料: 收入证明原件、资产证明文件、配偶身份证复印件。客户表示下午2点前补齐")
                .createdAt(now.minusMinutes(30))
                .build();

        HistoryRecord record3_6 = HistoryRecord.builder()
                .appointmentId(3L)
                .action("FOLLOW_UP")
                .actionName("跟进提醒")
                .detail("大堂经理电话提醒客户补交资料，客户确认下午2点送达")
                .createdAt(now.minusMinutes(15))
                .build();

        HistoryRecord record4_1 = HistoryRecord.builder()
                .appointmentId(4L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户预约贷款申请业务，贷款金额: 50万元")
                .createdAt(now.minusHours(5))
                .build();

        HistoryRecord record4_2 = HistoryRecord.builder()
                .appointmentId(4L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 30分钟")
                .createdAt(now.minusHours(2).minusMinutes(15))
                .build();

        HistoryRecord record4_3 = HistoryRecord.builder()
                .appointmentId(4L)
                .action("ASSIGN")
                .actionName("分配窗口")
                .detail("大堂经理王明分配给客户经理李芳，窗口: 3号窗口")
                .createdAt(now.minusHours(2))
                .build();

        HistoryRecord record4_4 = HistoryRecord.builder()
                .appointmentId(4L)
                .action("START_PROCESS")
                .actionName("开始处理")
                .detail("客户经理李芳开始为客户办理贷款申请业务")
                .createdAt(now.minusHours(1).minusMinutes(30))
                .build();

        HistoryRecord record4_5 = HistoryRecord.builder()
                .appointmentId(4L)
                .action("DUE_DILIGENCE_PENDING")
                .actionName("尽调补件")
                .detail("待补充: 工作单位证明、近6个月银行流水、征信授权书。已联系客户单位人事部门确认")
                .createdAt(now.minusMinutes(30))
                .build();

        HistoryRecord record4_6 = HistoryRecord.builder()
                .appointmentId(4L)
                .action("FOLLOW_UP")
                .actionName("跟进处理")
                .detail("运营主管张经理已知晓，安排加急处理尽调材料")
                .createdAt(now.minusMinutes(10))
                .build();

        HistoryRecord record5_1 = HistoryRecord.builder()
                .appointmentId(5L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户预约换卡业务")
                .createdAt(now.minusHours(6))
                .build();

        HistoryRecord record5_2 = HistoryRecord.builder()
                .appointmentId(5L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 15分钟")
                .createdAt(now.minusHours(3).minusMinutes(10))
                .build();

        HistoryRecord record5_3 = HistoryRecord.builder()
                .appointmentId(5L)
                .action("ASSIGN")
                .actionName("分配窗口")
                .detail("大堂经理王明分配给客户经理李芳，窗口: 1号窗口")
                .createdAt(now.minusHours(3))
                .build();

        HistoryRecord record5_4 = HistoryRecord.builder()
                .appointmentId(5L)
                .action("START_PROCESS")
                .actionName("开始处理")
                .detail("客户经理李芳开始为客户办理换卡业务")
                .createdAt(now.minusHours(2))
                .build();

        HistoryRecord record5_5 = HistoryRecord.builder()
                .appointmentId(5L)
                .action("COMPLAINT")
                .actionName("业务超时投诉")
                .detail("原因: 业务处理超时，等待超过2小时。客户情绪激动，要求立即处理。优先级提升至最高")
                .createdAt(now.minusMinutes(45))
                .build();

        HistoryRecord record5_6 = HistoryRecord.builder()
                .appointmentId(5L)
                .action("ESCALATE")
                .actionName("上报主管")
                .detail("已上报运营主管张经理，主管正在协调处理")
                .createdAt(now.minusMinutes(30))
                .build();

        HistoryRecord record5_7 = HistoryRecord.builder()
                .appointmentId(5L)
                .action("FOLLOW_UP")
                .actionName("客户安抚")
                .detail("大堂经理王明为客户倒水并解释情况，客户情绪稍缓")
                .createdAt(now.minusMinutes(15))
                .build();

        HistoryRecord record6_1 = HistoryRecord.builder()
                .appointmentId(6L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户预约外汇业务，购汇金额: 5万美元")
                .createdAt(now.minusHours(2))
                .build();

        HistoryRecord record6_2 = HistoryRecord.builder()
                .appointmentId(6L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 20分钟")
                .createdAt(now.minusMinutes(45))
                .build();

        HistoryRecord record6_3 = HistoryRecord.builder()
                .appointmentId(6L)
                .action("ASSIGN")
                .actionName("分配窗口")
                .detail("大堂经理王明分配给客户经理李芳，窗口: 4号窗口")
                .createdAt(now.minusMinutes(40))
                .build();

        HistoryRecord record6_4 = HistoryRecord.builder()
                .appointmentId(6L)
                .action("START_PROCESS")
                .actionName("开始处理")
                .detail("客户经理李芳开始为客户办理外汇购汇业务，金额较大需主管审批")
                .createdAt(now.minusMinutes(30))
                .build();

        HistoryRecord record7_1 = HistoryRecord.builder()
                .appointmentId(7L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户预约销户业务")
                .createdAt(now.minusHours(6))
                .build();

        HistoryRecord record7_2 = HistoryRecord.builder()
                .appointmentId(7L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 25分钟")
                .createdAt(now.minusHours(5).minusMinutes(5))
                .build();

        HistoryRecord record7_3 = HistoryRecord.builder()
                .appointmentId(7L)
                .action("ASSIGN")
                .actionName("分配窗口")
                .detail("大堂经理王明分配给客户经理李芳，窗口: 2号窗口")
                .createdAt(now.minusHours(5))
                .build();

        HistoryRecord record7_4 = HistoryRecord.builder()
                .appointmentId(7L)
                .action("START_PROCESS")
                .actionName("开始处理")
                .detail("客户经理李芳开始为客户办理销户业务")
                .createdAt(now.minusHours(4).minusMinutes(50))
                .build();

        HistoryRecord record7_5 = HistoryRecord.builder()
                .appointmentId(7L)
                .action("COMPLETE")
                .actionName("业务完成")
                .detail("销户业务办理顺利，客户满意离开。实际办理时长: 50分钟")
                .createdAt(now.minusHours(4))
                .build();

        HistoryRecord record8_1 = HistoryRecord.builder()
                .appointmentId(8L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户预约贷款申请业务")
                .createdAt(now.minusDays(1).minusHours(3))
                .build();

        HistoryRecord record8_2 = HistoryRecord.builder()
                .appointmentId(8L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 20分钟")
                .createdAt(now.minusDays(1).minusHours(2).plusMinutes(10))
                .build();

        HistoryRecord record8_3 = HistoryRecord.builder()
                .appointmentId(8L)
                .action("ASSIGN")
                .actionName("分配窗口")
                .detail("大堂经理王明分配给客户经理李芳，窗口: 3号窗口")
                .createdAt(now.minusDays(1).minusHours(2).plusMinutes(15))
                .build();

        HistoryRecord record8_4 = HistoryRecord.builder()
                .appointmentId(8L)
                .action("START_PROCESS")
                .actionName("开始处理")
                .detail("客户经理李芳开始为客户办理贷款申请业务")
                .createdAt(now.minusDays(1).minusHours(1).minusMinutes(40))
                .build();

        HistoryRecord record8_5 = HistoryRecord.builder()
                .appointmentId(8L)
                .action("MATERIAL_INCOMPLETE")
                .actionName("资料缺页待补")
                .detail("缺失资料: 收入证明、工作证明。客户表示下午补交")
                .createdAt(now.minusDays(1).minusHours(1).minusMinutes(30))
                .build();

        HistoryRecord record8_6 = HistoryRecord.builder()
                .appointmentId(8L)
                .action("FOLLOW_UP")
                .actionName("跟进提醒")
                .detail("大堂经理电话提醒客户补交资料")
                .createdAt(now.minusDays(1).minusHours(1))
                .build();

        HistoryRecord record8_7 = HistoryRecord.builder()
                .appointmentId(8L)
                .action("RESOLVE_MATERIAL")
                .actionName("资料补齐")
                .detail("客户下午补交资料: 收入证明、工作证明。资料审核通过")
                .createdAt(now.minusDays(1).minusHours(1).plusMinutes(30))
                .build();

        HistoryRecord record8_8 = HistoryRecord.builder()
                .appointmentId(8L)
                .action("COMPLETE")
                .actionName("业务完成")
                .detail("贷款申请业务办理完成，客户满意。实际办理时长: 40分钟")
                .createdAt(now.minusDays(1).minusHours(1).plusMinutes(40))
                .build();

        HistoryRecord record9_1 = HistoryRecord.builder()
                .appointmentId(9L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户预约理财咨询业务")
                .createdAt(now.minusDays(2).minusHours(4))
                .build();

        HistoryRecord record9_2 = HistoryRecord.builder()
                .appointmentId(9L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 15分钟")
                .createdAt(now.minusDays(2).minusHours(3).plusMinutes(5))
                .build();

        HistoryRecord record9_3 = HistoryRecord.builder()
                .appointmentId(9L)
                .action("ASSIGN")
                .actionName("分配窗口")
                .detail("大堂经理王明分配给客户经理李芳，窗口: 2号窗口")
                .createdAt(now.minusDays(2).minusHours(3).plusMinutes(10))
                .build();

        HistoryRecord record9_4 = HistoryRecord.builder()
                .appointmentId(9L)
                .action("START_PROCESS")
                .actionName("开始处理")
                .detail("客户经理李芳开始为客户办理理财咨询业务")
                .createdAt(now.minusDays(2).minusHours(2).minusMinutes(50))
                .build();

        HistoryRecord record9_5 = HistoryRecord.builder()
                .appointmentId(9L)
                .action("DUE_DILIGENCE_PENDING")
                .actionName("尽调补件")
                .detail("待补充: 风险评估问卷、投资经验证明。客户表示次日补交")
                .createdAt(now.minusDays(2).minusHours(2).minusMinutes(30))
                .build();

        HistoryRecord record9_6 = HistoryRecord.builder()
                .appointmentId(9L)
                .action("FOLLOW_UP")
                .actionName("跟进提醒")
                .detail("大堂经理电话提醒客户补交尽调材料")
                .createdAt(now.minusDays(2).minusHours(2))
                .build();

        HistoryRecord record9_7 = HistoryRecord.builder()
                .appointmentId(9L)
                .action("RESOLVE_DUE_DILIGENCE")
                .actionName("尽调完成")
                .detail("客户次日补交材料: 风险评估问卷、投资经验证明。尽调审核通过")
                .createdAt(now.minusDays(2).minusHours(2).plusMinutes(30))
                .build();

        HistoryRecord record9_8 = HistoryRecord.builder()
                .appointmentId(9L)
                .action("COMPLETE")
                .actionName("业务完成")
                .detail("理财咨询业务办理完成，客户满意。实际办理时长: 55分钟")
                .createdAt(now.minusDays(2).minusHours(2).plusMinutes(40))
                .build();

        HistoryRecord record10_1 = HistoryRecord.builder()
                .appointmentId(10L)
                .action("CREATE")
                .actionName("创建预约")
                .detail("客户预约换卡业务")
                .createdAt(now.minusDays(3).minusHours(2))
                .build();

        HistoryRecord record10_2 = HistoryRecord.builder()
                .appointmentId(10L)
                .action("CHECK_IN")
                .actionName("客户签到")
                .detail("客户到达网点签到，预计等待时间: 10分钟")
                .createdAt(now.minusDays(3).minusHours(1).plusMinutes(8))
                .build();

        HistoryRecord record10_3 = HistoryRecord.builder()
                .appointmentId(10L)
                .action("ASSIGN")
                .actionName("分配窗口")
                .detail("大堂经理王明分配给客户经理李芳，窗口: 1号窗口")
                .createdAt(now.minusDays(3).minusHours(1).plusMinutes(12))
                .build();

        HistoryRecord record10_4 = HistoryRecord.builder()
                .appointmentId(10L)
                .action("START_PROCESS")
                .actionName("开始处理")
                .detail("客户经理李芳开始为客户办理换卡业务")
                .createdAt(now.minusDays(3).minusMinutes(45))
                .build();

        HistoryRecord record10_5 = HistoryRecord.builder()
                .appointmentId(10L)
                .action("COMPLAINT")
                .actionName("业务超时投诉")
                .detail("原因: 前面业务处理时间过长，客户等待超过1.5小时。客户情绪激动，投诉至大堂经理")
                .createdAt(now.minusDays(3).minusMinutes(35))
                .build();

        HistoryRecord record10_6 = HistoryRecord.builder()
                .appointmentId(10L)
                .action("ESCALATE")
                .actionName("上报主管")
                .detail("已上报运营主管张经理，主管立即介入处理")
                .createdAt(now.minusDays(3).minusMinutes(30))
                .build();

        HistoryRecord record10_7 = HistoryRecord.builder()
                .appointmentId(10L)
                .action("RESOLVE_COMPLAINT")
                .actionName("投诉处理完成")
                .detail("处理结果: 致歉并优先办理，赠送小礼品安抚客户情绪。客户表示满意")
                .createdAt(now.minusDays(3).minusMinutes(25))
                .build();

        HistoryRecord record10_8 = HistoryRecord.builder()
                .appointmentId(10L)
                .action("COMPLETE")
                .actionName("业务完成")
                .detail("换卡业务办理完成，客户满意离开。实际办理时长: 30分钟")
                .createdAt(now.minusDays(3).minusMinutes(15))
                .build();

        historyRecordRepository.saveAll(Arrays.asList(
                record1_1,
                record2_1, record2_2,
                record3_1, record3_2, record3_3, record3_4, record3_5, record3_6,
                record4_1, record4_2, record4_3, record4_4, record4_5, record4_6,
                record5_1, record5_2, record5_3, record5_4, record5_5, record5_6, record5_7,
                record6_1, record6_2, record6_3, record6_4,
                record7_1, record7_2, record7_3, record7_4, record7_5,
                record8_1, record8_2, record8_3, record8_4, record8_5, record8_6, record8_7, record8_8,
                record9_1, record9_2, record9_3, record9_4, record9_5, record9_6, record9_7, record9_8,
                record10_1, record10_2, record10_3, record10_4, record10_5, record10_6, record10_7, record10_8
        ));
    }
}