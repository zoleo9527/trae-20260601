package com.elevator.smartparking.controller;

import com.elevator.smartparking.common.Result;
import com.elevator.smartparking.dto.*;
import com.elevator.smartparking.entity.*;
import com.elevator.smartparking.repository.*;
import com.elevator.smartparking.service.RoleActionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@Tag(name = "工作台", description = "按角色（客服/维保技师/项目主管）的待办、常用动作、统计汇总")
@RestController
@RequestMapping("/api/workspace")
@RequiredArgsConstructor
public class WorkspaceController {

    private final RoleActionService roleActionService;
    private final FaultReportRepository faultReportRepository;
    private final EntrapmentRescueRepository entrapmentRescueRepository;
    private final ElevatorRepository elevatorRepository;
    private final SysUserRepository sysUserRepository;

    @Operation(summary = "获取工作台数据", description = "按角色返回待办列表、统计汇总和常用动作")
    @GetMapping
    public Result<WorkspaceVO> getWorkspace(
            @Parameter(description = "用户角色: CUSTOMER_SERVICE/MAINTENANCE_TECHNICIAN/PROJECT_MANAGER")
            @RequestParam UserRole role,
            @Parameter(description = "用户ID，可选，用于过滤我的待办")
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Parameter(description = "用户姓名")
            @RequestHeader(value = "X-User-Name", required = false) String userName) {

        WorkspaceVO vo = new WorkspaceVO();
        vo.setRole(role.name());
        vo.setRoleName(roleActionService.getRoleName(role));
        vo.setOperatorName(userName);

        List<FaultStatus> faultTodoStatuses = roleActionService.getFaultTodoStatuses(role);
        List<FaultReport> allFaults = faultReportRepository.findAll();
        List<FaultReport> faultTodos = allFaults.stream()
                .filter(f -> faultTodoStatuses.contains(f.getStatus()))
                .filter(f -> filterMyFault(f, role, userId))
                .sorted((a, b) -> b.getCreateTime().compareTo(a.getCreateTime()))
                .toList();

        WorkspaceVO.FaultTodoSummary faultSummary = new WorkspaceVO.FaultTodoSummary();
        faultSummary.setTotal(faultTodos.size());
        faultSummary.setPending((int) faultTodos.stream().filter(f -> f.getStatus() == FaultStatus.PENDING).count());
        faultSummary.setProcessing((int) faultTodos.stream().filter(f -> f.getStatus() == FaultStatus.PROCESSING).count());
        faultSummary.setTransferred((int) faultTodos.stream().filter(f -> f.getStatus() == FaultStatus.TRANSFERRED_TO_RESCUE).count());
        faultSummary.setCompleted((int) allFaults.stream().filter(f -> f.getStatus() == FaultStatus.COMPLETED).count());
        vo.setFaultTodoSummary(faultSummary);

        List<FaultTodoItemVO> faultTodoList = new ArrayList<>();
        for (FaultReport f : faultTodos) {
            FaultTodoItemVO item = new FaultTodoItemVO();
            item.setId(f.getId());
            item.setReportNo(f.getReportNo());
            item.setElevatorId(f.getElevatorId());
            item.setFaultType(f.getFaultType());
            item.setFaultDescription(f.getFaultDescription());
            item.setStatus(f.getStatus().name());
            item.setStatusText(getFaultStatusText(f.getStatus()));
            item.setHandlerId(f.getHandlerId());
            item.setHasEntrapment(f.getHasEntrapment());
            item.setEntrapmentCount(f.getEntrapmentCount());
            item.setRemark(f.getRemark());
            item.setCreateTime(f.getCreateTime());
            item.setAcceptTime(f.getAcceptTime());
            item.setNextActions(roleActionService.getFaultNextActions(f.getStatus(), role));

            elevatorRepository.findById(f.getElevatorId())
                    .ifPresent(e -> item.setElevatorNo(e.getElevatorNo()));
            if (f.getHandlerId() != null) {
                sysUserRepository.findById(f.getHandlerId())
                        .ifPresent(u -> item.setHandlerName(u.getName()));
            }
            faultTodoList.add(item);
        }
        vo.setFaultTodoList(faultTodoList);

        List<RescueStatus> rescueTodoStatuses = roleActionService.getRescueTodoStatuses(role);
        List<EntrapmentRescue> allRescues = entrapmentRescueRepository.findAll();
        List<EntrapmentRescue> rescueTodos = allRescues.stream()
                .filter(r -> rescueTodoStatuses.contains(r.getStatus()))
                .filter(r -> filterMyRescue(r, role, userId))
                .sorted((a, b) -> b.getCreateTime().compareTo(a.getCreateTime()))
                .toList();

        WorkspaceVO.RescueTodoSummary rescueSummary = new WorkspaceVO.RescueTodoSummary();
        rescueSummary.setTotal(rescueTodos.size());
        rescueSummary.setPendingRescue((int) rescueTodos.stream().filter(r -> r.getStatus() == RescueStatus.PENDING_RESCUE).count());
        rescueSummary.setRescuing((int) rescueTodos.stream().filter(r -> r.getStatus() == RescueStatus.RESCUING).count());
        rescueSummary.setRescued((int) rescueTodos.stream().filter(r -> r.getStatus() == RescueStatus.RESCUED).count());
        rescueSummary.setCompleted((int) allRescues.stream().filter(r -> r.getStatus() == RescueStatus.COMPLETED).count());
        vo.setRescueTodoSummary(rescueSummary);

        List<RescueTodoItemVO> rescueTodoList = new ArrayList<>();
        for (EntrapmentRescue r : rescueTodos) {
            RescueTodoItemVO item = new RescueTodoItemVO();
            item.setId(r.getId());
            item.setRescueNo(r.getRescueNo());
            item.setElevatorId(r.getElevatorId());
            item.setFaultReportId(r.getFaultReportId());
            item.setTrappedCount(r.getTrappedCount());
            item.setTrappedFloor(r.getTrappedFloor());
            item.setStatus(r.getStatus().name());
            item.setStatusText(getRescueStatusText(r.getStatus()));
            item.setRescuerId(r.getRescuerId());
            item.setInitialRemark(r.getInitialRemark());
            item.setReportTime(r.getReportTime());
            item.setArrivalTime(r.getArrivalTime());
            item.setNextActions(roleActionService.getRescueNextActions(r.getStatus(), role));

            elevatorRepository.findById(r.getElevatorId())
                    .ifPresent(e -> item.setElevatorNo(e.getElevatorNo()));
            if (r.getRescuerId() != null) {
                sysUserRepository.findById(r.getRescuerId())
                        .ifPresent(u -> item.setRescuerName(u.getName()));
            }
            if (r.getFaultReportId() != null) {
                faultReportRepository.findById(r.getFaultReportId())
                        .ifPresent(f -> item.setFaultReportNo(f.getReportNo()));
            }
            rescueTodoList.add(item);
        }
        vo.setRescueTodoList(rescueTodoList);

        vo.setCommonFaultActions(roleActionService.getFaultNextActions(FaultStatus.PROCESSING, role));
        vo.setCommonRescueActions(roleActionService.getRescueNextActions(RescueStatus.RESCUING, role));

        return Result.success(vo);
    }

    @Operation(summary = "获取角色可处理的故障状态", description = "返回指定角色可看到的故障状态列表和每个状态下的可执行动作")
    @GetMapping("/fault-actions/{status}")
    public Result<List<ActionItemVO>> getFaultActions(
            @PathVariable FaultStatus status,
            @RequestParam UserRole role) {
        return Result.success(roleActionService.getFaultNextActions(status, role));
    }

    @Operation(summary = "获取角色可处理的困人状态", description = "返回指定角色可看到的困人状态列表和每个状态下的可执行动作")
    @GetMapping("/rescue-actions/{status}")
    public Result<List<ActionItemVO>> getRescueActions(
            @PathVariable RescueStatus status,
            @RequestParam UserRole role) {
        return Result.success(roleActionService.getRescueNextActions(status, role));
    }

    private String getFaultStatusText(FaultStatus status) {
        return switch (status) {
            case PENDING -> "待受理";
            case PROCESSING -> "处理中";
            case TRANSFERRED_TO_RESCUE -> "已转困人";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
        };
    }

    private String getRescueStatusText(RescueStatus status) {
        return switch (status) {
            case PENDING_RESCUE -> "待救援";
            case RESCUING -> "救援中";
            case RESCUED -> "已解救";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
        };
    }

    private boolean filterMyFault(FaultReport f, UserRole role, Long userId) {
        return switch (role) {
            case MAINTENANCE_TECHNICIAN -> userId != null && userId.equals(f.getHandlerId());
            case CUSTOMER_SERVICE, PROJECT_MANAGER -> true;
        };
    }

    private boolean filterMyRescue(EntrapmentRescue r, UserRole role, Long userId) {
        return switch (role) {
            case MAINTENANCE_TECHNICIAN -> userId != null && userId.equals(r.getRescuerId());
            case CUSTOMER_SERVICE, PROJECT_MANAGER -> true;
        };
    }
}
