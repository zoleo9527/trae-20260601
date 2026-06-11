package com.elevator.maintenance.dto;

import lombok.Data;

@Data
public class CheckInRequest {
    private Long planId;
    private Long technicianId;
    private Double latitude;
    private Double longitude;
    private String locationRemark;
    private String photoData;

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getLocationRemark() { return locationRemark; }
    public void setLocationRemark(String locationRemark) { this.locationRemark = locationRemark; }
    public String getPhotoData() { return photoData; }
    public void setPhotoData(String photoData) { this.photoData = photoData; }
}
