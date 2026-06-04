package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.Complaint;
import com.medical.aesthetic.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByCustomerProjectId(Long customerProjectId);

    List<Complaint> findByStatus(ComplaintStatus status);

    List<Complaint> findByHandledById(Long handledById);

    List<Complaint> findByComplaintType(String complaintType);
}
