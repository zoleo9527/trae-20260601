package com.example.tailor.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, unique = true, length = 50)
    private String orderNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabric_card_id", nullable = false)
    private FabricCard fabricCard;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "product_type", length = 100)
    private String productType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;

    @Column(name = "expected_delivery_date")
    private LocalDateTime expectedDeliveryDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Measurement measurement;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<FittingFeedback> feedbacks;

    public Order() {}

    public Order(Long id, String orderNo, Customer customer, FabricCard fabricCard, String productName, String productType, BigDecimal price, LocalDateTime orderDate, LocalDateTime expectedDeliveryDate, LocalDateTime createdAt, LocalDateTime updatedAt, Measurement measurement, List<FittingFeedback> feedbacks) {
        this.id = id;
        this.orderNo = orderNo;
        this.customer = customer;
        this.fabricCard = fabricCard;
        this.productName = productName;
        this.productType = productType;
        this.price = price;
        this.orderDate = orderDate;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.measurement = measurement;
        this.feedbacks = feedbacks;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public FabricCard getFabricCard() { return fabricCard; }
    public void setFabricCard(FabricCard fabricCard) { this.fabricCard = fabricCard; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public LocalDateTime getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(LocalDateTime expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Measurement getMeasurement() { return measurement; }
    public void setMeasurement(Measurement measurement) { this.measurement = measurement; }
    public List<FittingFeedback> getFeedbacks() { return feedbacks; }
    public void setFeedbacks(List<FittingFeedback> feedbacks) { this.feedbacks = feedbacks; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (orderDate == null) {
            orderDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}