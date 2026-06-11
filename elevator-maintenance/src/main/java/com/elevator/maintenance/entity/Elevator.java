package com.elevator.maintenance.entity;

import lombok.Data;

import javax.persistence.*;

@Data
@Entity
@Table(name = "elevator")
public class Elevator {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String projectName;

    private String elevatorNo;

    private String address;

    private String model;

    private String manufacturer;

    private String installDate;

    private String nextMaintenanceDate;

    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getElevatorNo() { return elevatorNo; }
    public void setElevatorNo(String elevatorNo) { this.elevatorNo = elevatorNo; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public String getInstallDate() { return installDate; }
    public void setInstallDate(String installDate) { this.installDate = installDate; }
    public String getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(String nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
