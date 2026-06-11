package com.elevator.maintenance.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "maintenance_plan")
public class MaintenancePlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String planNo;

    private Long elevatorId;

    private Long technicianId;

    private LocalDateTime planTime;

    @Column(length = 1000)
    private String content;

    private String status;

    private Long dispatcherId;

    private Long supervisorId;

    private String reviewRemark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @Transient
    private String elevatorNo;

    @Transient
    private String projectName;

    @Transient
    private String address;

    @Transient
    private String technicianName;

    @Transient
    private String dispatcherName;

    @Transient
    private String supervisorName;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPlanNo() { return planNo; }
    public void setPlanNo(String planNo) { this.planNo = planNo; }
    public Long getElevatorId() { return elevatorId; }
    public void setElevatorId(Long elevatorId) { this.elevatorId = elevatorId; }
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public LocalDateTime getPlanTime() { return planTime; }
    public void setPlanTime(LocalDateTime planTime) { this.planTime = planTime; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getDispatcherId() { return dispatcherId; }
    public void setDispatcherId(Long dispatcherId) { this.dispatcherId = dispatcherId; }
    public Long getSupervisorId() { return supervisorId; }
    public void setSupervisorId(Long supervisorId) { this.supervisorId = supervisorId; }
    public String getReviewRemark() { return reviewRemark; }
    public void setReviewRemark(String reviewRemark) { this.reviewRemark = reviewRemark; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
    public String getElevatorNo() { return elevatorNo; }
    public void setElevatorNo(String elevatorNo) { this.elevatorNo = elevatorNo; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getTechnicianName() { return technicianName; }
    public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
    public String getDispatcherName() { return dispatcherName; }
    public void setDispatcherName(String dispatcherName) { this.dispatcherName = dispatcherName; }
    public String getSupervisorName() { return supervisorName; }
    public void setSupervisorName(String supervisorName) { this.supervisorName = supervisorName; }
}
