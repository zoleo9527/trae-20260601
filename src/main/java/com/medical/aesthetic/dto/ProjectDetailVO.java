package com.medical.aesthetic.dto;

import com.medical.aesthetic.entity.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDetailVO {
    private CustomerProject customerProject;
    private Customer customer;
    private Project project;
    private Employee consultant;
    private Employee doctor;
    private Employee doctorAssistant;
    private List<MaterialReservation> materialReservations;
    private Order order;
    private List<InstallmentPlan> installmentPlans;
    private List<Complaint> complaints;
    private List<FollowUpRecord> followUpRecords;
    private List<HistoryNote> historyNotes;
}
