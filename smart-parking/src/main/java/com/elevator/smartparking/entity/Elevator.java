package com.elevator.smartparking.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "elevator")
public class Elevator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "elevator_no", nullable = false, unique = true, length = 50)
    private String elevatorNo;

    @Column(length = 100)
    private String location;

    @Column(length = 100)
    private String building;

    @Column(name = "floor_count")
    private Integer floorCount;

    @Column(length = 100)
    private String manufacturer;

    @Column(name = "install_date")
    private LocalDate installDate;

    @Column(name = "last_inspection_date")
    private LocalDate lastInspectionDate;

    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;

    @Column(length = 20)
    private String status;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}
