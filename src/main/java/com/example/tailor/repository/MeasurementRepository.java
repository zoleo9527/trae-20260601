package com.example.tailor.repository;

import com.example.tailor.entity.Measurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeasurementRepository extends JpaRepository<Measurement, Long> {
    Optional<Measurement> findByOrderId(Long orderId);
}