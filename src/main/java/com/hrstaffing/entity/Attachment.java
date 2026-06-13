package com.hrstaffing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "attachment", indexes = {
        @Index(name = "idx_att_biz", columnList = "bizType, bizId")
})
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String originalFileName;

    @Column(nullable = false, length = 256)
    private String storedFileName;

    @Column(nullable = false, length = 512)
    private String filePath;

    @Column(nullable = false)
    private Long fileSize;

    @Column(length = 64)
    private String contentType;

    @Column(nullable = false, length = 32)
    private String bizType;

    @Column(nullable = false)
    private Long bizId;

    @Column(length = 256)
    private String remark;

    @Column(nullable = false)
    private Long uploadedBy;

    @Column(length = 64)
    private String uploadedByName;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
