package com.elevator.smartparking.service;

import com.elevator.smartparking.entity.FaultStatus;
import com.elevator.smartparking.entity.RescueStatus;
import com.elevator.smartparking.entity.UserRole;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class StatusConstraintService {

    private final Map<FaultStatus, Set<FaultStatus>> faultValidTransitions = new EnumMap<>(FaultStatus.class);
    private final Map<RescueStatus, Set<RescueStatus>> rescueValidTransitions = new EnumMap<>(RescueStatus.class);

    public StatusConstraintService() {
        faultValidTransitions.put(FaultStatus.PENDING, Set.of(
                FaultStatus.PROCESSING,
                FaultStatus.CANCELLED
        ));
        faultValidTransitions.put(FaultStatus.PROCESSING, Set.of(
                FaultStatus.TRANSFERRED_TO_RESCUE,
                FaultStatus.COMPLETED,
                FaultStatus.CANCELLED
        ));
        faultValidTransitions.put(FaultStatus.TRANSFERRED_TO_RESCUE, Collections.emptySet());
        faultValidTransitions.put(FaultStatus.COMPLETED, Collections.emptySet());
        faultValidTransitions.put(FaultStatus.CANCELLED, Collections.emptySet());

        rescueValidTransitions.put(RescueStatus.PENDING_RESCUE, Set.of(
                RescueStatus.RESCUING,
                RescueStatus.CANCELLED
        ));
        rescueValidTransitions.put(RescueStatus.RESCUING, Set.of(
                RescueStatus.RESCUED,
                RescueStatus.CANCELLED
        ));
        rescueValidTransitions.put(RescueStatus.RESCUED, Set.of(
                RescueStatus.COMPLETED
        ));
        rescueValidTransitions.put(RescueStatus.COMPLETED, Collections.emptySet());
        rescueValidTransitions.put(RescueStatus.CANCELLED, Collections.emptySet());
    }

    public boolean canTransitionFault(FaultStatus from, FaultStatus to) {
        return faultValidTransitions.getOrDefault(from, Collections.emptySet()).contains(to);
    }

    public boolean canTransitionRescue(RescueStatus from, RescueStatus to) {
        return rescueValidTransitions.getOrDefault(from, Collections.emptySet()).contains(to);
    }

    public List<FaultStatus> getFaultNextStates(FaultStatus current) {
        return new ArrayList<>(faultValidTransitions.getOrDefault(current, Collections.emptySet()));
    }

    public List<RescueStatus> getRescueNextStates(RescueStatus current) {
        return new ArrayList<>(rescueValidTransitions.getOrDefault(current, Collections.emptySet()));
    }

    public Map<String, Object> getFaultStateMachine() {
        List<Map<String, Object>> states = new ArrayList<>();
        for (FaultStatus s : FaultStatus.values()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", s.name());
            m.put("text", getFaultStatusText(s));
            m.put("isTerminal", faultValidTransitions.get(s).isEmpty());
            List<String> next = faultValidTransitions.get(s).stream()
                    .map(Enum::name).toList();
            m.put("validNextStates", next);
            states.add(m);
        }

        List<Map<String, Object>> transitions = new ArrayList<>();
        for (FaultStatus from : FaultStatus.values()) {
            for (FaultStatus to : faultValidTransitions.get(from)) {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("from", from.name());
                t.put("to", to.name());
                t.put("allowedRoles", getFaultTransitionRoles(from, to).stream().map(Enum::name).toList());
                t.put("triggerAction", getFaultTriggerAction(from, to));
                transitions.add(t);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("description", "故障报修状态机：PENDING(待受理) → PROCESSING(处理中) → [COMPLETED(已完成) | TRANSFERRED_TO_RESCUE(已转困人)]. 终端态:COMPLETED/CANCELLED/TRANSFERRED_TO_RESCUE");
        result.put("initialState", FaultStatus.PENDING.name());
        result.put("states", states);
        result.put("transitions", transitions);
        return result;
    }

    public Map<String, Object> getRescueStateMachine() {
        List<Map<String, Object>> states = new ArrayList<>();
        for (RescueStatus s : RescueStatus.values()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", s.name());
            m.put("text", getRescueStatusText(s));
            m.put("isTerminal", rescueValidTransitions.get(s).isEmpty());
            List<String> next = rescueValidTransitions.get(s).stream()
                    .map(Enum::name).toList();
            m.put("validNextStates", next);
            states.add(m);
        }

        List<Map<String, Object>> transitions = new ArrayList<>();
        for (RescueStatus from : RescueStatus.values()) {
            for (RescueStatus to : rescueValidTransitions.get(from)) {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("from", from.name());
                t.put("to", to.name());
                t.put("allowedRoles", getRescueTransitionRoles(from, to).stream().map(Enum::name).toList());
                t.put("triggerAction", getRescueTriggerAction(from, to));
                transitions.add(t);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("description", "困人处置状态机：PENDING_RESCUE(待救援) → RESCUING(救援中) → RESCUED(已解救) → COMPLETED(已完成). 终端态:COMPLETED/CANCELLED");
        result.put("initialState", RescueStatus.PENDING_RESCUE.name());
        result.put("states", states);
        result.put("transitions", transitions);
        result.put("crossEntityLink", "故障报修 PROCESSING → TRANSFERRED_TO_RESCUE 时会自动创建困人处置 PENDING_RESCUE,两者通过 faultReportId/transferRescueId 关联");
        return result;
    }

    public List<UserRole> getFaultTransitionRoles(FaultStatus from, FaultStatus to) {
        return switch (from) {
            case PENDING -> switch (to) {
                case PROCESSING -> List.of(UserRole.CUSTOMER_SERVICE, UserRole.PROJECT_MANAGER);
                case CANCELLED -> List.of(UserRole.CUSTOMER_SERVICE, UserRole.PROJECT_MANAGER);
                default -> Collections.emptyList();
            };
            case PROCESSING -> switch (to) {
                case TRANSFERRED_TO_RESCUE -> List.of(UserRole.CUSTOMER_SERVICE, UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER);
                case COMPLETED -> List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER);
                case CANCELLED -> List.of(UserRole.CUSTOMER_SERVICE, UserRole.PROJECT_MANAGER);
                default -> Collections.emptyList();
            };
            default -> Collections.emptyList();
        };
    }

    public List<UserRole> getRescueTransitionRoles(RescueStatus from, RescueStatus to) {
        return switch (from) {
            case PENDING_RESCUE -> switch (to) {
                case RESCUING -> List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER);
                case CANCELLED -> List.of(UserRole.CUSTOMER_SERVICE, UserRole.PROJECT_MANAGER);
                default -> Collections.emptyList();
            };
            case RESCUING -> switch (to) {
                case RESCUED -> List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER);
                case CANCELLED -> List.of(UserRole.CUSTOMER_SERVICE, UserRole.PROJECT_MANAGER);
                default -> Collections.emptyList();
            };
            case RESCUED -> switch (to) {
                case COMPLETED -> List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER);
                default -> Collections.emptyList();
            };
            default -> Collections.emptyList();
        };
    }

    private String getFaultTriggerAction(FaultStatus from, FaultStatus to) {
        return switch (from) {
            case PENDING -> switch (to) {
                case PROCESSING -> "POST /api/fault-reports/{id}/accept (受理并指派处理人)";
                case CANCELLED -> "POST /api/fault-reports/{id}/cancel (取消工单)";
                default -> "";
            };
            case PROCESSING -> switch (to) {
                case TRANSFERRED_TO_RESCUE -> "POST /api/fault-reports/{id}/transfer-rescue (转困人处置,自动创建困人处置工单)";
                case COMPLETED -> "POST /api/fault-reports/{id}/complete (填写处理结果并关闭)";
                case CANCELLED -> "POST /api/fault-reports/{id}/cancel (取消工单)";
                default -> "";
            };
            default -> "";
        };
    }

    private String getRescueTriggerAction(RescueStatus from, RescueStatus to) {
        return switch (from) {
            case PENDING_RESCUE -> switch (to) {
                case RESCUING -> "POST /api/entrapment-rescues/{id}/start (救援人员到场,开始救援)";
                case CANCELLED -> "POST /api/entrapment-rescues/{id}/cancel (取消工单)";
                default -> "";
            };
            case RESCUING -> switch (to) {
                case RESCUED -> "POST /api/entrapment-rescues/{id}/rescue-success (人员已解救)";
                case CANCELLED -> "POST /api/entrapment-rescues/{id}/cancel (取消工单)";
                default -> "";
            };
            case RESCUED -> switch (to) {
                case COMPLETED -> "POST /api/entrapment-rescues/{id}/complete (填写困人原因和处置方案并关闭)";
                default -> "";
            };
            default -> "";
        };
    }

    public String getFaultStatusText(FaultStatus status) {
        return switch (status) {
            case PENDING -> "待受理";
            case PROCESSING -> "处理中";
            case TRANSFERRED_TO_RESCUE -> "已转困人处置";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
        };
    }

    public String getRescueStatusText(RescueStatus status) {
        return switch (status) {
            case PENDING_RESCUE -> "待救援";
            case RESCUING -> "救援中";
            case RESCUED -> "已解救";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
        };
    }
}
