package com.example.tailor.dto.response;

import java.time.LocalDateTime;

public class FabricCardDTO {

    private Long id;
    private String fabricCode;
    private String fabricName;
    private String fabricType;
    private String color;
    private String pattern;
    private Double width;
    private String description;
    private LocalDateTime createdAt;

    public FabricCardDTO() {}

    public FabricCardDTO(Long id, String fabricCode, String fabricName, String fabricType, String color, String pattern, Double width, String description, LocalDateTime createdAt) {
        this.id = id;
        this.fabricCode = fabricCode;
        this.fabricName = fabricName;
        this.fabricType = fabricType;
        this.color = color;
        this.pattern = pattern;
        this.width = width;
        this.description = description;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFabricCode() { return fabricCode; }
    public void setFabricCode(String fabricCode) { this.fabricCode = fabricCode; }
    public String getFabricName() { return fabricName; }
    public void setFabricName(String fabricName) { this.fabricName = fabricName; }
    public String getFabricType() { return fabricType; }
    public void setFabricType(String fabricType) { this.fabricType = fabricType; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; }
    public Double getWidth() { return width; }
    public void setWidth(Double width) { this.width = width; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}