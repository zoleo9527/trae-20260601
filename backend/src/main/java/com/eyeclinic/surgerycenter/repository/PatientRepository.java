package com.eyeclinic.surgerycenter.repository;

import com.eyeclinic.surgerycenter.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPatientNo(String patientNo);
    Optional<Patient> findByIdCard(String idCard);
}
