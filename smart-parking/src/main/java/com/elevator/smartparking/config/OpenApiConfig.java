package com.elevator.smartparking.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("电梯维保管理系统 API")
                        .version("1.0.0")
                        .description("电梯维保-故障报修与困人处置模块接口文档。\n\n" +
                                "## 验收接口清单（重点检查\n" +
                                "1. **状态约束与模型关系** - `/api/status-meta/**` 提供完整的状态机定义、合法流转、跨实体关系说明\n" +
                                "2. **困人处置详情(含历史回看** - `GET /api/entrapment-rescues/{id}` 返回 timeline(时间线) 和 remarkChain(备注链) 和 faultRecords(关联故障报修处理记录\n" +
                                "3. **故障报修处理** - 受理/处理/转困人/完成/取消 均接入状态机校验，非法流转抛出明确错误\n" +
                                "4. **详情查询** - 故障报修/困人处置详情均返回完整 records + timeline + remarkChain\n" +
                                "5. **工作台（轻量能力** - 导出/附件/消息通知状态占位，说明清晰不含糊\n\n" +
                                "## 核心模型关系\n" +
                                "- **故障报修(FaultReport)** → 1:N → **困人处置(EntrapmentRescue)** 通过 faultReportId / transferRescueId 互相关联\n" +
                                "- **备注共享机制:**\n" +
                                "  - 转单时 snapshot: EntrapmentRescue.initialRemark = FaultReport.remark\n" +
                                "  - 详情中: 困人详情 remarkChain 聚合: faultRemark + faultTransferRemark + initialRemark + rescue处理记录 + rescue最新remark\n" +
                                "  - 故障详情 remarkChain 聚合: fault处理记录 + fault最新remark + 转单initialRemark + rescue处理记录\n\n" +
                                "## 核心状态机\n" +
                                "### 故障报修状态 (详见 GET /api/status-meta/fault-state-machine)\n" +
                                "- `PENDING` 待受理 → `PROCESSING` 处理中 → [`TRANSFERRED_TO_RESCUE` 已转困人 | `COMPLETED` 已完成\n" +
                                "- `PENDING` / `PROCESSING` → `CANCELLED` 已取消\n" +
                                "### 困人处置状态 (详见 GET /api/status-meta/rescue-state-machine)\n" +
                                "- `PENDING_RESCUE` 待救援 → `RESCUING` 救援中 → `RESCUED` 已解救 → `COMPLETED` 已完成\n" +
                                "- `PENDING_RESCUE` / `RESCUING` → `CANCELLED` 已取消\n\n" +
                                "## 角色与动作\n" +
                                "- **客服(CUSTOMER_SERVICE)**: 受理故障报修、转单、取消、查看所有待办\n" + "- **维保技师(MAINTENANCE_TECHNICIAN)**: 处理故障、执行救援、完成闭环\n" +
                                "- **项目主管(PROJECT_MANAGER)**: 全流程所有权限\n\n" +
                                "## 轻量能力说明（导出/附件/消息通知\n" +
                                "- **导出**: 仅状态占位(NOT_EXPORTED/EXPORTING/EXPORTED/FAILED)，不生成实际文件，接口见 `/api/light-capability/export/**`\n" +
                                "- **附件**: 仅计数占位(attachmentCount)，不存储实际文件，接口见 `/api/light-capability/attachments/**`\n" +
                                "- **消息通知**: 仅状态占位(NOT_NOTIFIED/NOTIFIED/FAILED)，不实际发送，接口见 `/api/light-capability/notify/**`\n\n" +
                                "## 请求头\n" +
                                "- `X-User-Id`: 操作人ID\n" +
                                "- `X-User-Name`: 操作人姓名")
                        .contact(new Contact()
                                .name("维保系统")
                                .email("support@elevator.com")))
                .tags(List.of(
                        new Tag().name("故障报修").description("【验收重点】故障报修CRUD + 受理/处理/转困人/完成/取消 + 详情查询(含历史时间线+备注链)"),
                        new Tag().name("困人处置").description("【验收重点】困人处置CRUD + 救援/解救/完成 + 详情回看(时间线+备注链+关联故障报修记录)"),
                        new Tag().name("状态约束与模型关系").description("【验收重点】完整状态机定义、合法流转校验接口、跨实体关系说明"),
                        new Tag().name("工作台").description("按角色（客服/维保技师/项目主管）待办+常用动作+统计"),
                        new Tag().name("轻量能力").description("导出/附件/消息通知 - 轻量实现状态占位,说明清晰不含糊"),
                        new Tag().name("电梯管理").description("电梯基础信息管理"),
                        new Tag().name("用户管理").description("系统用户与角色管理")
                ));
    }
}
