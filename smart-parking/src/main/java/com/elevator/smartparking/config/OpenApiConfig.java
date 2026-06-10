package com.elevator.smartparking.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("电梯维保管理系统 API")
                        .version("1.0.0")
                        .description("电梯维保-故障报修与困人处置模块接口文档。\n\n" +
                                "## 核心模型\n" +
                                "- **故障报修(FaultReport)**: 客户报修故障，从创建到处理完成的全流程\n" +
                                "- **困人处置(EntrapmentRescue)**: 人员被困电梯的紧急救援处置\n" +
                                "- **处理记录(HandleRecord)**: 所有状态变更和操作的流水记录，用于历史回看\n\n" +
                                "## 状态流转\n" +
                                "### 故障报修状态\n" +
                                "- `PENDING` 待受理 → `PROCESSING` 处理中 → `TRANSFERRED_TO_RESCUE` 已转困人 / `COMPLETED` 已完成\n" +
                                "- `PENDING` / `PROCESSING` → `CANCELLED` 已取消\n\n" +
                                "### 困人处置状态\n" +
                                "- `PENDING_RESCUE` 待救援 → `RESCUING` 救援中 → `RESCUED` 已解救 → `COMPLETED` 已完成\n" +
                                "- `PENDING_RESCUE` / `RESCUING` → `CANCELLED` 已取消\n\n" +
                                "## 说明\n" +
                                "- 故障报修可以转困人处置，转单时备注信息会自动带入困人处置的初始备注\n" +
                                "- 详情接口包含完整的处理记录流水，支持历史回看\n" +
                                "- 操作人ID通过请求头 `X-User-Id` 和 `X-User-Name` 传递")
                        .contact(new Contact()
                                .name("维保系统")
                                .email("support@elevator.com")));
    }
}
