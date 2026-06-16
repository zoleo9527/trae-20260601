package com.example.tailor.dto.response;

import java.time.LocalDateTime;

public class MeasurementDTO {

    private Long id;
    private Long orderId;
    private Long measurerId;
    private String measurerName;
    private Double bust;
    private Double waist;
    private Double hips;
    private Double shoulderWidth;
    private Double sleeveLength;
    private Double armhole;
    private Double backLength;
    private Double frontLength;
    private Double neckCircumference;
    private Double wristCircumference;
    private Double thighCircumference;
    private Double kneeCircumference;
    private Double inseamLength;
    private Double outseamLength;
    private LocalDateTime measurementDate;
    private String notes;
    private LocalDateTime createdAt;

    public MeasurementDTO() {}

    public MeasurementDTO(Long id, Long orderId, Long measurerId, String measurerName, Double bust, Double waist, Double hips, Double shoulderWidth, Double sleeveLength, Double armhole, Double backLength, Double frontLength, Double neckCircumference, Double wristCircumference, Double thighCircumference, Double kneeCircumference, Double inseamLength, Double outseamLength, LocalDateTime measurementDate, String notes, LocalDateTime createdAt) {
        this.id = id;
        this.orderId = orderId;
        this.measurerId = measurerId;
        this.measurerName = measurerName;
        this.bust = bust;
        this.waist = waist;
        this.hips = hips;
        this.shoulderWidth = shoulderWidth;
        this.sleeveLength = sleeveLength;
        this.armhole = armhole;
        this.backLength = backLength;
        this.frontLength = frontLength;
        this.neckCircumference = neckCircumference;
        this.wristCircumference = wristCircumference;
        this.thighCircumference = thighCircumference;
        this.kneeCircumference = kneeCircumference;
        this.inseamLength = inseamLength;
        this.outseamLength = outseamLength;
        this.measurementDate = measurementDate;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getMeasurerId() { return measurerId; }
    public void setMeasurerId(Long measurerId) { this.measurerId = measurerId; }
    public String getMeasurerName() { return measurerName; }
    public void setMeasurerName(String measurerName) { this.measurerName = measurerName; }
    public Double getBust() { return bust; }
    public void setBust(Double bust) { this.bust = bust; }
    public Double getWaist() { return waist; }
    public void setWaist(Double waist) { this.waist = waist; }
    public Double getHips() { return hips; }
    public void setHips(Double hips) { this.hips = hips; }
    public Double getShoulderWidth() { return shoulderWidth; }
    public void setShoulderWidth(Double shoulderWidth) { this.shoulderWidth = shoulderWidth; }
    public Double getSleeveLength() { return sleeveLength; }
    public void setSleeveLength(Double sleeveLength) { this.sleeveLength = sleeveLength; }
    public Double getArmhole() { return armhole; }
    public void setArmhole(Double armhole) { this.armhole = armhole; }
    public Double getBackLength() { return backLength; }
    public void setBackLength(Double backLength) { this.backLength = backLength; }
    public Double getFrontLength() { return frontLength; }
    public void setFrontLength(Double frontLength) { this.frontLength = frontLength; }
    public Double getNeckCircumference() { return neckCircumference; }
    public void setNeckCircumference(Double neckCircumference) { this.neckCircumference = neckCircumference; }
    public Double getWristCircumference() { return wristCircumference; }
    public void setWristCircumference(Double wristCircumference) { this.wristCircumference = wristCircumference; }
    public Double getThighCircumference() { return thighCircumference; }
    public void setThighCircumference(Double thighCircumference) { this.thighCircumference = thighCircumference; }
    public Double getKneeCircumference() { return kneeCircumference; }
    public void setKneeCircumference(Double kneeCircumference) { this.kneeCircumference = kneeCircumference; }
    public Double getInseamLength() { return inseamLength; }
    public void setInseamLength(Double inseamLength) { this.inseamLength = inseamLength; }
    public Double getOutseamLength() { return outseamLength; }
    public void setOutseamLength(Double outseamLength) { this.outseamLength = outseamLength; }
    public LocalDateTime getMeasurementDate() { return measurementDate; }
    public void setMeasurementDate(LocalDateTime measurementDate) { this.measurementDate = measurementDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}