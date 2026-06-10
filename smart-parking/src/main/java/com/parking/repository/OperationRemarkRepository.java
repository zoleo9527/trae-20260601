package com.parking.repository;

import com.parking.entity.OperationRemark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationRemarkRepository extends JpaRepository<OperationRemark, Long> {

    List<OperationRemark> findByGateFaultIdOrderByCreatedAtDesc(Long gateFaultId);

    List<OperationRemark> findByRemoteReleaseIdOrderByCreatedAtDesc(Long remoteReleaseId);

    List<OperationRemark> findByGateFaultIdOrRemoteReleaseIdOrderByCreatedAtDesc(Long gateFaultId, Long remoteReleaseId);
}
