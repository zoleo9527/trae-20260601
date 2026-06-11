package com.park.decoration.config;

import com.park.decoration.entity.*;
import com.park.decoration.enums.ApplicationStatus;
import com.park.decoration.enums.PermitStatus;
import com.park.decoration.enums.PriorityLevel;
import com.park.decoration.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DecorationApplicationRepository applicationRepository;
    private final EntryPermitRepository permitRepository;
    private final ExceptionNoteRepository exceptionRepository;
    private final OperationLogRepository logRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (applicationRepository.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        String dateStr = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        DecorationApplication app1 = createApplication(
                "DEC-" + dateStr + "-A00001", "idempotent-key-a001",
                "科技创新有限公司", "张明", "13800138001",
                "智慧产业园A区", "A1", "301",
                280.5, "办公区域整体装修改造",
                now.minusDays(5), now.plusDays(25),
                "华盛装饰工程有限公司", "李工", "13900139001",
                ApplicationStatus.PENDING_REVIEW, PriorityLevel.HIGH,
                "新入驻企业，需尽快完成装修以投入办公",
                null, null,
                now.minusHours(2), now.minusHours(2),
                "招商部-王芳", "招商部-王芳"
        );
        applicationRepository.save(app1);
        addLog(app1, "SUBMIT", null, null, null,
               "提交装修申请", "招商部-王芳", now.minusHours(2));

        DecorationApplication app2 = createApplication(
                "DEC-" + dateStr + "-A00002", "idempotent-key-a002",
                "云端数据科技", "刘芳", "13800138002",
                "智慧产业园A区", "A2", "501-502",
                520.0, "数据中心及办公区装修，含机房建设",
                now.minusDays(3), now.plusDays(45),
                "专业机房建设公司", "赵经理", "13900139002",
                ApplicationStatus.UNDER_REVIEW, PriorityLevel.HIGH,
                "涉及消防改造，需重点审核",
                "工程部-陈工", null,
                now.minusHours(28), now.minusHours(3),
                "招商部-李娜", "工程部-陈工"
        );
        applicationRepository.save(app2);
        addLog(app2, "SUBMIT", null, null, null,
               "提交装修申请", "招商部-李娜", now.minusHours(28));
        addLog(app2, "ASSIGN", "assignedHandler", null, "工程部-陈工",
               "分配工程审核", "招商部-李娜", now.minusHours(26));

        DecorationApplication app3 = createApplication(
                "DEC-" + dateStr + "-A00003", "idempotent-key-a003",
                "绿叶环保科技", "陈强", "13800138003",
                "智慧产业园B区", "B3", "201",
                180.0, "实验室及办公区装修",
                now.minusDays(10), now.plusDays(15),
                "科瑞实验室工程", "孙工", "13900139003",
                ApplicationStatus.APPROVED, PriorityLevel.MEDIUM,
                null, null,
                "审核通过，消防方案符合要求",
                now.minusDays(6), now.minusDays(1),
                "招商部-周杰", "工程部-陈工"
        );
        applicationRepository.save(app3);
        addLog(app3, "SUBMIT", null, null, null,
               "提交装修申请", "招商部-周杰", now.minusDays(6));
        addLog(app3, "APPROVE", "status", "UNDER_REVIEW", "APPROVED",
               "审核通过", "工程部-陈工", now.minusDays(1));

        DecorationApplication app4 = createApplication(
                "DEC-" + dateStr + "-A00004", "idempotent-key-a004",
                "星辰文化传媒", "吴婷", "13800138004",
                "智慧产业园B区", "B1", "401",
                350.0, "直播间、录音棚及办公区装修",
                now.minusDays(15), now.plusDays(20),
                "声盾声学工程", "郑工", "13900139004",
                ApplicationStatus.PERMIT_ISSUED, PriorityLevel.MEDIUM,
                "需注意隔音处理，避免扰民",
                null,
                "审核通过，已发进场许可",
                now.minusDays(10), now.minusHours(5),
                "招商部-王芳", "物业部-林主任"
        );
        applicationRepository.save(app4);
        addLog(app4, "SUBMIT", null, null, null,
               "提交装修申请", "招商部-王芳", now.minusDays(10));
        addLog(app4, "ISSUE_PERMIT", "status", "APPROVED", "PERMIT_ISSUED",
               "签发进场许可", "物业部-林主任", now.minusHours(5));

        EntryPermit permit4 = createPermit(
                "EP-" + dateStr + "-P00001", app4, PermitStatus.APPROVED,
                now.minusHours(5), now.plusDays(20),
                "B1栋401室直播间、录音棚及办公区装修施工",
                "室内装修、声学处理、电气安装",
                "施工人员须佩戴安全帽，严禁明火，每日18:00后停止产生噪音的作业",
                "星辰文化传媒-吴婷 13800138004",
                "施工人员需办理临时出入证，遵守园区管理规定",
                "物业部-林主任", now.minusHours(5)
        );
        permitRepository.save(permit4);

        DecorationApplication app5 = createApplication(
                "DEC-" + dateStr + "-A00005", "idempotent-key-a005",
                "蓝天生物制药", "黄磊", "13800138005",
                "智慧产业园C区", "C2", "101-102",
                650.0, "GMP洁净车间及研发中心装修",
                now.minusDays(30), now.plusDays(60),
                "洁净工程科技公司", "韩总", "13900139005",
                ApplicationStatus.IN_PROGRESS, PriorityLevel.HIGH,
                "洁净等级要求高，全程监管",
                null,
                "审核通过，施工中",
                now.minusDays(25), now.minusHours(30),
                "招商部-李娜", "工程部-陈工"
        );
        applicationRepository.save(app5);
        addLog(app5, "SUBMIT", null, null, null,
               "提交装修申请", "招商部-李娜", now.minusDays(25));
        addLog(app5, "ISSUE_PERMIT", "status", "APPROVED", "PERMIT_ISSUED",
               "签发进场许可", "物业部-林主任", now.minusDays(20));
        addLog(app5, "START", "status", "PERMIT_ISSUED", "IN_PROGRESS",
               "施工开始", "蓝天生物-黄磊", now.minusDays(18));

        EntryPermit permit5 = createPermit(
                "EP-" + dateStr + "-P00002", app5, PermitStatus.APPROVED,
                now.minusDays(20), now.plusDays(60),
                "C2栋101-102室GMP洁净车间及研发中心",
                "洁净车间建设、空调系统、水电安装",
                "严格遵守GMP施工规范，人员需更衣消毒后方可进入施工区域",
                "蓝天生物制药-黄磊 13800138005",
                "施工垃圾每日清理，保持通道畅通",
                "物业部-林主任", now.minusDays(20)
        );
        permitRepository.save(permit5);

        ExceptionNote ex1 = createException(
                app5, "施工临时用电超出申请容量",
                "施工方私自接入大功率设备，导致配电室跳闸，影响周边企业正常用电。经核查，申请用电容量为50KW，但实际使用约80KW。",
                "已造成C栋部分区域停电约30分钟",
                "洁净工程科技公司-韩总 13900139005",
                "要求施工方立即拆除违规设备，重新提交用电方案并经审核后才能继续施工",
                null,
                "物业部-保安队长", now.minusHours(30),
                null, null, false
        );
        exceptionRepository.save(ex1);
        addLog(app5, "EXCEPTION_REPORTED", null, null, null,
               "报告异常：施工临时用电超出申请容量", "物业部-保安队长", now.minusHours(30));

        DecorationApplication app6 = createApplication(
                "DEC-" + dateStr + "-A00006", "idempotent-key-a006",
                "恒通物流科技", "徐明", "13800138006",
                "智慧产业园A区", "A3", "102",
                150.0, "办公区简单装修",
                now.minusDays(20), now.minusDays(1),
                "本地装修队", "王队", "13900139006",
                ApplicationStatus.COMPLETED, PriorityLevel.LOW,
                null, null,
                "竣工验收通过",
                now.minusDays(20), now.minusDays(1),
                "招商部-周杰", "物业部-林主任"
        );
        applicationRepository.save(app6);
        addLog(app6, "SUBMIT", null, null, null,
               "提交装修申请", "招商部-周杰", now.minusDays(20));
        addLog(app6, "COMPLETE", "status", "IN_PROGRESS", "COMPLETED",
               "装修完成，竣工验收通过", "物业部-林主任", now.minusDays(1));

        addLog(app2, "NOTE", null, null, null,
               "系统提醒：审核超时，请尽快处理", "system", now.minusMinutes(10));
    }

    private DecorationApplication createApplication(
            String applicationNo, String idempotentKey,
            String companyName, String contactPerson, String contactPhone,
            String parkName, String buildingNo, String roomNo,
            Double decorationArea, String decorationScope,
            LocalDateTime plannedStartDate, LocalDateTime plannedEndDate,
            String constructionCompany, String constructionContact, String constructionPhone,
            ApplicationStatus status, PriorityLevel priority,
            String remark, String assignedHandler, String reviewOpinion,
            LocalDateTime createdAt, LocalDateTime updatedAt,
            String createdBy, String updatedBy) {
        return DecorationApplication.builder()
                .applicationNo(applicationNo)
                .idempotentKey(idempotentKey)
                .companyName(companyName)
                .contactPerson(contactPerson)
                .contactPhone(contactPhone)
                .parkName(parkName)
                .buildingNo(buildingNo)
                .roomNo(roomNo)
                .decorationArea(decorationArea)
                .decorationScope(decorationScope)
                .plannedStartDate(plannedStartDate)
                .plannedEndDate(plannedEndDate)
                .constructionCompany(constructionCompany)
                .constructionContact(constructionContact)
                .constructionPhone(constructionPhone)
                .status(status)
                .priority(priority)
                .remark(remark)
                .assignedHandler(assignedHandler)
                .reviewOpinion(reviewOpinion)
                .reviewedAt(reviewOpinion != null ? updatedAt : null)
                .reviewedBy(reviewOpinion != null ? updatedBy : null)
                .createdAt(createdAt)
                .createdBy(createdBy)
                .updatedAt(updatedAt)
                .updatedBy(updatedBy)
                .version(1)
                .build();
    }

    private EntryPermit createPermit(
            String permitNo, DecorationApplication app, PermitStatus status,
            LocalDateTime validFrom, LocalDateTime validTo,
            String permittedScope, String permittedWorkTypes,
            String safetyRequirements, String responsibleParty,
            String managementRequirements, String issuedBy, LocalDateTime issuedAt) {
        return EntryPermit.builder()
                .permitNo(permitNo)
                .application(app)
                .applicationNo(app.getApplicationNo())
                .status(status)
                .validFrom(validFrom)
                .validTo(validTo)
                .permittedScope(permittedScope)
                .permittedWorkTypes(permittedWorkTypes)
                .safetyRequirements(safetyRequirements)
                .responsibleParty(responsibleParty)
                .managementRequirements(managementRequirements)
                .issuedBy(issuedBy)
                .issuedAt(issuedAt)
                .createdAt(issuedAt)
                .updatedAt(issuedAt)
                .build();
    }

    private ExceptionNote createException(
            DecorationApplication app, String title, String description,
            String impact, String responsiblePerson, String resolution, String attachmentUrls,
            String reportedBy, LocalDateTime reportedAt,
            String resolvedBy, LocalDateTime resolvedAt, Boolean resolved) {
        return ExceptionNote.builder()
                .application(app)
                .applicationNo(app.getApplicationNo())
                .title(title)
                .description(description)
                .impact(impact)
                .responsiblePerson(responsiblePerson)
                .resolution(resolution)
                .attachmentUrls(attachmentUrls)
                .reportedBy(reportedBy)
                .reportedAt(reportedAt)
                .resolvedBy(resolvedBy)
                .resolvedAt(resolvedAt)
                .resolved(resolved)
                .build();
    }

    private void addLog(DecorationApplication app, String type, String field,
                        String oldVal, String newVal, String remark,
                        String operator, LocalDateTime operatedAt) {
        OperationLog log = OperationLog.builder()
                .application(app)
                .applicationNo(app.getApplicationNo())
                .operationType(type)
                .fieldName(field)
                .oldValue(oldVal)
                .newValue(newVal)
                .remark(remark)
                .operator(operator)
                .operatedAt(operatedAt)
                .build();
        logRepository.save(log);
    }
}
