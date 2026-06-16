package com.example.tailor.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "measurement")
public class Measurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(name = "measurer_id", nullable = false)
    private Long measurerId;

    @Column(name = "measurer_name", nullable = false, length = 100)
    private String measurerName;

    @Column
    private Double bust;

    @Column
    private Double waist;

    @Column
    private Double hips;

    @Column(name = "shoulder_width")
    private Double shoulderWidth;

    @Column(name = "sleeve_length")
    private Double sleeveLength;

    @Column(name = "armhole")
    private Double armhole;

    @Column(name = "back_length")
    private Double backLength;

    @Column(name = "front_length")
    private Double frontLength;

    @Column(name = "neck_circumference")
    private Double neckCircumference;

    @Column(name = "wrist_circumference")
    private Double wristCircumference;

    @Column(name = "thigh_circumference")
    private Double thighCircumference;

    @Column(name = "knee_circumference")
    private Double kneeCircumference;

    @Column(name = "inseam_length")
    private Double inseamLength;

    @Column(name = "outseam_length")
    private Double outseamLength;

    @Column(name = "measurement_date", nullable = false)
    private LocalDateTime measurementDate;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Measurement() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
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
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (measurementDate == null) {
            measurementDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}