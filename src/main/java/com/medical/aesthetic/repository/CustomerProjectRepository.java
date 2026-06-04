package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.CustomerProject;
import com.medical.aesthetic.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerProjectRepository extends JpaRepository<CustomerProject, Long> {

    List<CustomerProject> findByCustomerId(Long customerId);

    List<CustomerProject> findByStatus(ProjectStatus status);

    List<CustomerProject> findByConsultantId(Long consultantId);

    List<CustomerProject> findByDoctorAssistantId(Long doctorAssistantId);

    @Query("SELECT cp FROM CustomerProject cp WHERE cp.status = :status AND cp.scheduledTime BETWEEN :start AND :end")
    List<CustomerProject> findScheduledProjects(@Param("status") ProjectStatus status,
                                                @Param("start") LocalDateTime start,
                                                @Param("end") LocalDateTime end);

    @Query("SELECT cp FROM CustomerProject cp WHERE cp.status IN ('SCHEDULED', 'MATERIAL_RESERVED') " +
           "AND cp.doctorAssistantId IS NULL")
    List<CustomerProject> findProjectsWithoutAssistant();

    @Query("SELECT cp FROM CustomerProject cp WHERE cp.status = 'SCHEDULED' " +
           "AND NOT EXISTS (SELECT mr FROM MaterialReservation mr WHERE mr.customerProject.id = cp.id)")
    List<CustomerProject> findScheduledWithoutMaterialReservation();
}
