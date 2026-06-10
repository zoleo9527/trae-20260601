package com.elevator.smartparking.dto;

import lombok.Data;
import java.util.List;

@Data
public class WorkspaceVO {

    private String role;
    private String roleName;
    private String operatorName;
    private FaultTodoSummary faultTodoSummary;
    private RescueTodoSummary rescueTodoSummary;
    private List<FaultTodoItemVO> faultTodoList;
    private List<RescueTodoItemVO> rescueTodoList;
    private List<ActionItemVO> commonFaultActions;
    private List<ActionItemVO> commonRescueActions;

    @Data
    public static class FaultTodoSummary {
        private Integer total;
        private Integer pending;
        private Integer processing;
        private Integer transferred;
        private Integer completed;
    }

    @Data
    public static class RescueTodoSummary {
        private Integer total;
        private Integer pendingRescue;
        private Integer rescuing;
        private Integer rescued;
        private Integer completed;
    }
}
