package com.example.bank.controller;

import com.example.bank.dto.response.AppointmentResponse;
import com.example.bank.enums.AppointmentStatus;
import com.example.bank.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final AppointmentService appointmentService;

    @GetMapping("/lobby-manager")
    public ResponseEntity<LobbyManagerTasksResponse> getLobbyManagerTasks() {
        List<AppointmentResponse> pendingCheckIn = appointmentService.getAppointmentsByStatus("PENDING");
        
        List<AppointmentResponse> checkedInUnassigned = appointmentService.getPendingAppointments().stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN && a.getAssignedUserId() == null)
                .collect(Collectors.toList());

        LobbyManagerTasksResponse response = new LobbyManagerTasksResponse();
        response.setPendingCheckIn(pendingCheckIn);
        response.setCheckedInUnassigned(checkedInUnassigned);
        response.setTotalCount(pendingCheckIn.size() + checkedInUnassigned.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/account-manager/{userId}")
    public ResponseEntity<AccountManagerTasksResponse> getAccountManagerTasks(@PathVariable Long userId) {
        List<AppointmentResponse> myTasks = appointmentService.getAppointmentsForUser(userId).stream()
                .filter(a -> a.getStatus() != AppointmentStatus.COMPLETED && a.getStatus() != AppointmentStatus.CANCELLED)
                .collect(Collectors.toList());

        List<AppointmentResponse> materialIssues = appointmentService.getAppointmentsByStatus("MATERIAL_INCOMPLETE").stream()
                .filter(a -> userId.equals(a.getAssignedUserId()))
                .collect(Collectors.toList());

        List<AppointmentResponse> dueDiligenceIssues = appointmentService.getAppointmentsByStatus("DUE_DILIGENCE_PENDING").stream()
                .filter(a -> userId.equals(a.getAssignedUserId()))
                .collect(Collectors.toList());

        List<AppointmentResponse> complaintIssues = appointmentService.getAppointmentsByStatus("COMPLAINT_RECORDED").stream()
                .filter(a -> userId.equals(a.getAssignedUserId()))
                .collect(Collectors.toList());

        AccountManagerTasksResponse response = new AccountManagerTasksResponse();
        response.setMyTasks(myTasks);
        response.setMaterialIssues(materialIssues);
        response.setDueDiligenceIssues(dueDiligenceIssues);
        response.setComplaintIssues(complaintIssues);
        response.setTotalCount(myTasks.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/operation-supervisor")
    public ResponseEntity<OperationSupervisorTasksResponse> getOperationSupervisorTasks() {
        List<AppointmentResponse> allAppointments = appointmentService.getAllAppointments();
        
        List<AppointmentResponse> complaintIssues = appointmentService.getAppointmentsByStatus("COMPLAINT_RECORDED");
        
        List<AppointmentResponse> materialIssues = appointmentService.getAppointmentsByStatus("MATERIAL_INCOMPLETE");
        
        List<AppointmentResponse> dueDiligenceIssues = appointmentService.getAppointmentsByStatus("DUE_DILIGENCE_PENDING");

        long pendingCount = allAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING)
                .count();
        long processingCount = allAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PROCESSING || 
                            a.getStatus() == AppointmentStatus.CHECKED_IN)
                .count();
        long completedCount = allAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .count();
        long issueCount = materialIssues.size() + dueDiligenceIssues.size() + complaintIssues.size();

        OperationSupervisorTasksResponse response = new OperationSupervisorTasksResponse();
        response.setAllAppointments(allAppointments);
        response.setComplaintIssues(complaintIssues);
        response.setMaterialIssues(materialIssues);
        response.setDueDiligenceIssues(dueDiligenceIssues);
        response.setStatistics(new StatisticsSummary(
            (int) pendingCount, 
            (int) processingCount, 
            (int) completedCount, 
            (int) issueCount,
            allAppointments.size()
        ));
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/issues")
    public ResponseEntity<IssueTasksResponse> getAllIssueTasks() {
        List<AppointmentResponse> materialIssues = appointmentService.getAppointmentsByStatus("MATERIAL_INCOMPLETE");
        List<AppointmentResponse> dueDiligenceIssues = appointmentService.getAppointmentsByStatus("DUE_DILIGENCE_PENDING");
        List<AppointmentResponse> complaintIssues = appointmentService.getAppointmentsByStatus("COMPLAINT_RECORDED");

        IssueTasksResponse response = new IssueTasksResponse();
        response.setMaterialIssues(materialIssues);
        response.setDueDiligenceIssues(dueDiligenceIssues);
        response.setComplaintIssues(complaintIssues);
        response.setTotalCount(materialIssues.size() + dueDiligenceIssues.size() + complaintIssues.size());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/mark-material-incomplete")
    public ResponseEntity<AppointmentResponse> markMaterialIncomplete(
            @PathVariable Long id,
            @RequestParam String missingDocs,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(appointmentService.markMaterialIncomplete(id, missingDocs, remarks));
    }

    @PostMapping("/{id}/mark-due-diligence-pending")
    public ResponseEntity<AppointmentResponse> markDueDiligencePending(
            @PathVariable Long id,
            @RequestParam String pendingItems,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(appointmentService.markDueDiligencePending(id, pendingItems, remarks));
    }

    @PostMapping("/{id}/record-complaint")
    public ResponseEntity<AppointmentResponse> recordComplaint(
            @PathVariable Long id,
            @RequestParam String complaintReason,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(appointmentService.recordComplaint(id, complaintReason, remarks));
    }

    @PostMapping("/{id}/resolve-material")
    public ResponseEntity<AppointmentResponse> resolveMaterialIssue(
            @PathVariable Long id,
            @RequestParam String resolvedDocs,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(appointmentService.resolveMaterialIssue(id, resolvedDocs, remarks));
    }

    @PostMapping("/{id}/resolve-due-diligence")
    public ResponseEntity<AppointmentResponse> resolveDueDiligence(
            @PathVariable Long id,
            @RequestParam String completedItems,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(appointmentService.resolveDueDiligence(id, completedItems, remarks));
    }

    @PostMapping("/{id}/resolve-complaint")
    public ResponseEntity<AppointmentResponse> resolveComplaint(
            @PathVariable Long id,
            @RequestParam String resolution,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(appointmentService.resolveComplaint(id, resolution, remarks));
    }

    @lombok.Data
    public static class LobbyManagerTasksResponse {
        private List<AppointmentResponse> pendingCheckIn = new ArrayList<>();
        private List<AppointmentResponse> checkedInUnassigned = new ArrayList<>();
        private Integer totalCount;
    }

    @lombok.Data
    public static class AccountManagerTasksResponse {
        private List<AppointmentResponse> myTasks = new ArrayList<>();
        private List<AppointmentResponse> materialIssues = new ArrayList<>();
        private List<AppointmentResponse> dueDiligenceIssues = new ArrayList<>();
        private List<AppointmentResponse> complaintIssues = new ArrayList<>();
        private Integer totalCount;
    }

    @lombok.Data
    public static class OperationSupervisorTasksResponse {
        private List<AppointmentResponse> allAppointments = new ArrayList<>();
        private List<AppointmentResponse> complaintIssues = new ArrayList<>();
        private List<AppointmentResponse> materialIssues = new ArrayList<>();
        private List<AppointmentResponse> dueDiligenceIssues = new ArrayList<>();
        private StatisticsSummary statistics;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class StatisticsSummary {
        private Integer pendingCount;
        private Integer processingCount;
        private Integer completedCount;
        private Integer issueCount;
        private Integer totalCount;
    }

    @lombok.Data
    public static class IssueTasksResponse {
        private List<AppointmentResponse> materialIssues = new ArrayList<>();
        private List<AppointmentResponse> dueDiligenceIssues = new ArrayList<>();
        private List<AppointmentResponse> complaintIssues = new ArrayList<>();
        private Integer totalCount;
    }
}