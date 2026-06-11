package com.park.decoration.repository;

import com.park.decoration.entity.EntryPermit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntryPermitRepository extends JpaRepository<EntryPermit, Long> {

    Optional<EntryPermit> findByPermitNo(String permitNo);

    List<EntryPermit> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    Optional<EntryPermit> findTopByApplicationIdOrderByCreatedAtDesc(Long applicationId);
}
