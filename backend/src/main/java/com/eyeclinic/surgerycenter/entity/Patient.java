package com.eyeclinic.surgerycenter.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "patient")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String patientNo;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 10)
    private String gender;

    private LocalDate birthDate;

    @Column(length = 20)
    private String idCard;

    @Column(length = 20)
    private String phone;

    @Column(length = 200)
    private String address;

    @Column(length = 500)
    private String medicalHistory;

    @Column(length = 500)
    private String allergyHistory;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private Integer age;
}
