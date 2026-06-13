package com.hrstaffing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32, unique = true)
    private String employeeNo;

    @Column(nullable = false, length = 64)
    private String name;

    @Column(length = 16)
    private String phone;

    @Column(length = 64)
    private String idCard;

    @Column(length = 64)
    private String clientCompany;

    @Column(length = 64)
    private String siteLocation;

    @Column(length = 128)
    private String position;

    @Column(nullable = false)
    private Long recruiterId;

    @Column(length = 64)
    private String recruiterName;

    @Column(nullable = false)
    private Long supervisorId;

    @Column(length = 64)
    private String supervisorName;

    @Column(nullable = false, length = 16)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
