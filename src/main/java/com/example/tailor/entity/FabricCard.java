package com.example.tailor.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "fabric_card")
public class FabricCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fabric_code", nullable = false, unique = true, length = 50)
    private String fabricCode;

    @Column(name = "fabric_name", nullable = false, length = 100)
    private String fabricName;

    @Column(name = "fabric_type", length = 50)
    private String fabricType;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "pattern", length = 100)
    private String pattern;

    @Column(name = "width")
    private Double width;

    @Column(length = 500)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "fabricCard", cascade = CascadeType.ALL)
    private List<Order> orders;

    public FabricCard() {}

    public FabricCard(Long id, String fabricCode, String fabricName, String fabricType, String color, String pattern, Double width, String description, LocalDateTime createdAt, LocalDateTime updatedAt, List<Order> orders) {
        this.id = id;
        this.fabricCode = fabricCode;
        this.fabricName = fabricName;
        this.fabricType = fabricType;
        this.color = color;
        this.pattern = pattern;
        this.width = width;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.orders = orders;
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
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<Order> getOrders() { return orders; }
    public void setOrders(List<Order> orders) { this.orders = orders; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}