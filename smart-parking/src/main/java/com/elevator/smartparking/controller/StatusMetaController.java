package com.elevator.smartparking.controller;

import com.elevator.smartparking.common.Result;
import com.elevator.smartparking.service.StatusConstraintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Tag(name = "状态约束与模型关系", description = "故障报修/困人处置的状态机定义、合法状态流转、跨实体关系说明。验收接口必查。")
@RestController
@RequestMapping("/api/status-meta")
@RequiredArgsConstructor
public class StatusMetaController {

    private final StatusConstraintService statusConstraintService;

    @Operation(summary = "获取故障报修状态机", description = "返回所有故障报修状态定义、合法流转路径、允许的角色、触发接口。用于前端动态生成动作按钮和状态提示。")
    @GetMapping("/fault-state-machine")
    public Result<Map<String, Object>> getFaultStateMachine() {
        return Result.success(statusConstraintService.getFaultStateMachine());
    }

    @Operation(summary = "获取困人处置状态机", description = "返回所有困人处置状态定义、合法流转路径、允许的角色、触发接口。以及与故障报修的跨实体关联说明。")
    @GetMapping("/rescue-state-machine")
    public Result<Map<String, Object>> getRescueStateMachine() {
        return Result.success(statusConstraintService.getRescueStateMachine());
    }

    @Operation(summary = "查询故障报修下一合法状态", description = "传入当前状态，返回可流转到的下一状态列表及对应触发动作")
    @GetMapping("/fault-next-states/{current}")
    public Result<Map<String, Object>> getFaultNextStates(@PathVariable String current) {
        try {
            com.elevator.smartparking.entity.FaultStatus curr = com.elevator.smartparking.entity.FaultStatus.valueOf(current);
            List<com.elevator.smartparking.entity.FaultStatus> nextStates = statusConstraintService.getFaultNextStates(curr);
            List<Map<String, Object>> transitions = new ArrayList<>();
            for (com.elevator.smartparking.entity.FaultStatus to : nextStates) {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("toState", to.name());
                t.put("toStateText", statusConstraintService.getFaultStatusText(to));
                t.put("allowedRoles", statusConstraintService.getFaultTransitionRoles(curr, to).stream().map(Enum::name).toList());
                transitions.add(t);
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("currentState", curr.name());
            result.put("currentStateText", statusConstraintService.getFaultStatusText(curr));
            result.put("validTransitions", transitions);
            return Result.success(result);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("无效的状态值: " + current);
        }
    }

    @Operation(summary = "查询困人处置下一合法状态", description = "传入当前状态，返回可流转到的下一状态列表及对应触发动作")
    @GetMapping("/rescue-next-states/{current}")
    public Result<Map<String, Object>> getRescueNextStates(@PathVariable String current) {
        try {
            com.elevator.smartparking.entity.RescueStatus curr = com.elevator.smartparking.entity.RescueStatus.valueOf(current);
            List<com.elevator.smartparking.entity.RescueStatus> nextStates = statusConstraintService.getRescueNextStates(curr);
            List<Map<String, Object>> transitions = new ArrayList<>();
            for (com.elevator.smartparking.entity.RescueStatus to : nextStates) {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("toState", to.name());
                t.put("toStateText", statusConstraintService.getRescueStatusText(to));
                t.put("allowedRoles", statusConstraintService.getRescueTransitionRoles(curr, to).stream().map(Enum::name).toList());
                transitions.add(t);
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("currentState", curr.name());
            result.put("currentStateText", statusConstraintService.getRescueStatusText(curr));
            result.put("validTransitions", transitions);
            return Result.success(result);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("无效的状态值: " + current);
        }
    }

    @Operation(summary = "校验故障报修状态流转合法性", description = "判断 from -> to 的流转是否合法，返回是否允许及原因")
    @GetMapping("/fault-check-transition")
    public Result<Map<String, Object>> checkFaultTransition(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String role) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            com.elevator.smartparking.entity.FaultStatus fromS = com.elevator.smartparking.entity.FaultStatus.valueOf(from);
            com.elevator.smartparking.entity.FaultStatus toS = com.elevator.smartparking.entity.FaultStatus.valueOf(to);
            boolean transitionOk = statusConstraintService.canTransitionFault(fromS, toS);
            result.put("from", from);
            result.put("fromText", statusConstraintService.getFaultStatusText(fromS));
            result.put("to", to);
            result.put("toText", statusConstraintService.getFaultStatusText(toS));
            result.put("transitionAllowed", transitionOk);
            if (!transitionOk) {
                result.put("reason", fromS + " 状态不可流转到 " + toS);
            } else if (role != null) {
                try {
                    com.elevator.smartparking.entity.UserRole r = com.elevator.smartparking.entity.UserRole.valueOf(role);
                    boolean roleOk = statusConstraintService.getFaultTransitionRoles(fromS, toS).contains(r);
                    result.put("role", role);
                    result.put("roleAllowed", roleOk);
                    if (!roleOk) {
                        result.put("roleReason", "角色 " + role + " 无权限执行此状态流转,允许角色:" + statusConstraintService.getFaultTransitionRoles(fromS, toS));
                    }
                } catch (IllegalArgumentException ignored) {
                    result.put("roleWarning", "无效的角色值");
                }
            }
            return Result.success(result);
        } catch (IllegalArgumentException e) {
            result.put("error", "无效的状态值: " + e.getMessage());
            return Result.success(result);
        }
    }

    @Operation(summary = "校验困人处置状态流转合法性", description = "判断 from -> to 的流转是否合法，返回是否允许及原因")
    @GetMapping("/rescue-check-transition")
    public Result<Map<String, Object>> checkRescueTransition(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String role) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            com.elevator.smartparking.entity.RescueStatus fromS = com.elevator.smartparking.entity.RescueStatus.valueOf(from);
            com.elevator.smartparking.entity.RescueStatus toS = com.elevator.smartparking.entity.RescueStatus.valueOf(to);
            boolean transitionOk = statusConstraintService.canTransitionRescue(fromS, toS);
            result.put("from", from);
            result.put("fromText", statusConstraintService.getRescueStatusText(fromS));
            result.put("to", to);
            result.put("toText", statusConstraintService.getRescueStatusText(toS));
            result.put("transitionAllowed", transitionOk);
            if (!transitionOk) {
                result.put("reason", fromS + " 状态不可流转到 " + toS);
            } else if (role != null) {
                try {
                    com.elevator.smartparking.entity.UserRole r = com.elevator.smartparking.entity.UserRole.valueOf(role);
                    boolean roleOk = statusConstraintService.getRescueTransitionRoles(fromS, toS).contains(r);
                    result.put("role", role);
                    result.put("roleAllowed", roleOk);
                    if (!roleOk) {
                        result.put("roleReason", "角色 " + role + " 无权限执行此状态流转,允许角色:" + statusConstraintService.getRescueTransitionRoles(fromS, toS));
                    }
                } catch (IllegalArgumentException ignored) {
                    result.put("roleWarning", "无效的角色值");
                }
            }
            return Result.success(result);
        } catch (IllegalArgumentException e) {
            result.put("error", "无效的状态值: " + e.getMessage());
            return Result.success(result);
        }
    }

    @Operation(summary = "跨实体模型关系说明", description = "故障报修(FaultReport) <-> 困人处置(EntrapmentRescue) 的关联关系、责任边界、备注共享机制说明")
    @GetMapping("/model-relations")
    public Result<Map<String, Object>> getModelRelations() {
        Map<String, Object> result = new LinkedHashMap<>();

        List<Map<String, Object>> relations = new ArrayList<>();
        Map<String, Object> rel1 = new LinkedHashMap<>();
        rel1.put("name", "FaultReport -> EntrapmentRescue (1:N)");
        rel1.put("foreignKey", "EntrapmentRescue.faultReportId -> FaultReport.id");
        rel1.put("reverseLink", "FaultReport.transferRescueId -> EntrapmentRescue.id (最近一次转单)");
        rel1.put("triggerCondition", "故障报修 PROCESSING --(transfer-rescue)--> TRANSFERRED_TO_RESCUE");
        rel1.put("createdEntityState", "新建困人处置初始化为 PENDING_RESCUE");
        rel1.put("remarkSharing", "1. 创建时:EntrapmentRescue.initialRemark = FaultReport.remark; 2. 处理中:困人处置可读取关联故障报修所有处理记录的remark作为上下文参考; 3. 返回详情接口:RescueDetailVO 包含 faultRemark, faultTransferRemark 等全部关联备注");
        rel1.put("responsibilityBoundary", "故障报修: 设备故障的发现、受理、派单、维修处理; 困人处置: 人员安全的救援、解救、后续安抚; 转单后两者并行存在,故障报修需等待困人处置完成或独立完成");
        relations.add(rel1);

        Map<String, Object> rel2 = new LinkedHashMap<>();
        rel2.put("name", "HandleRecord -> (FaultReport | EntrapmentRescue) (N:1)");
        rel2.put("discriminator", "HandleRecord.recordType (FAULT_REPORT / ENTRAPMENT_RESCUE) + recordId");
        rel2.put("purpose", "记录每一次状态流转和处理动作,用于详情页的历史回看(时间线)");
        rel2.put("immutable", "true - 处理记录只追加不修改");
        relations.add(rel2);

        result.put("description", "电梯维保-故障报修与困人处置核心实体关系");
        result.put("relations", relations);

        Map<String, Object> remarkFlow = new LinkedHashMap<>();
        remarkFlow.put("faultRemark", "存在于 FaultReport.remark (最新值) + 每次 processReport/completeReport 写入 HandleRecord.content");
        remarkFlow.put("rescueInitialRemark", "从故障报修转入时 snapshot 到 EntrapmentRescue.initialRemark (不可变)");
        remarkFlow.put("rescueRemark", "困人处置救援过程中 EntrapmentRescue.remark (最新值) + 每次 updateProgress 写入 HandleRecord");
        remarkFlow.put("remarkChainInDetail", "困人处置详情接口返回: faultRemark(故障备注) + faultTransferRemark(转单时备注) + initialRemark(快照) + rescue.remark + 所有 HandleRecord.content 形成完整备注链");
        result.put("remarkSharingMechanism", remarkFlow);

        return Result.success(result);
    }
}
