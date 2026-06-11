package com.elevator.maintenance.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "check_in_record")
public class CheckInRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long planId;

    private Long technicianId;

    private Long elevatorId;

    private LocalDateTime checkInTime;

    private LocalDateTime checkOutTime;

    private Double latitude;

    private Double longitude;

    private String locationRemark;

    @Lob
    private String photoData;

    @Column(length = 1000)
    private String workContent;

    @Column(length = 1000)
    private String workResult;

    @Column(length = 1000)
    private String problemDesc;

    @Column(length = 1000)
    private String solution;

    @Column(length = 1000)
    private String remark;

    @Transient
    private String technicianName;

    @Transient
    private String elevatorNo;

    @Transient
    private String projectName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public Long getElevatorId() { return elevatorId; }
    public void setElevatorId(Long elevatorId) { this.elevatorId = elevatorId; }
    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }
    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getLocationRemark() { return locationRemark; }
    public void setLocationRemark(String locationRemark) { this.locationRemark = locationRemark; }
    public String getPhotoData() { return photoData; }
    public void setPhotoData(String photoData) { this.photoData = photoData; }
    public String getWorkContent() { return workContent; }
    public void setWorkContent(String workContent) { this.workContent = workContent; }
    public String getWorkResult() { return workResult; }
    public void setWorkResult(String workResult) { this.workResult = workResult; }
    public String getProblemDesc() { return problemDesc; }
    public void setProblemDesc(String problemDesc) { this.problemDesc = problemDesc; }
    public String getSolution() { return solution; }
    public void setSolution(String solution) { this.solution = solution; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public String getTechnicianName() { return technicianName; }
    public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
    public String getElevatorNo() { return elevatorNo; }
    public void setElevatorNo(String elevatorNo) { this.elevatorNo = elevatorNo; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
}
