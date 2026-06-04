package com.medical.aesthetic.service;

import com.medical.aesthetic.common.ResultCode;
import com.medical.aesthetic.context.UserContext;
import com.medical.aesthetic.dto.MaterialReservationDTO;
import com.medical.aesthetic.entity.CustomerProject;
import com.medical.aesthetic.entity.Employee;
import com.medical.aesthetic.entity.Material;
import com.medical.aesthetic.entity.MaterialReservation;
import com.medical.aesthetic.enums.MaterialStatus;
import com.medical.aesthetic.enums.ProjectStatus;
import com.medical.aesthetic.enums.RoleType;
import com.medical.aesthetic.exception.BusinessException;
import com.medical.aesthetic.repository.CustomerProjectRepository;
import com.medical.aesthetic.repository.MaterialRepository;
import com.medical.aesthetic.repository.MaterialReservationRepository;
import com.medical.aesthetic.repository.ProjectMaterialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MaterialReservationService {

    private final MaterialReservationRepository materialReservationRepository;
    private final MaterialRepository materialRepository;
    private final CustomerProjectRepository customerProjectRepository;
    private final ProjectMaterialRepository projectMaterialRepository;
    private final HistoryNoteService historyNoteService;

    @Transactional(readOnly = true)
    public List<MaterialReservation> getByProjectId(Long projectId) {
        return materialReservationRepository.findByCustomerProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public List<MaterialReservation> getActiveReservations(Long projectId) {
        return materialReservationRepository.findActiveReservationsByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public List<MaterialReservation> getReservationHistory(LocalDateTime start, LocalDateTime end) {
        return materialReservationRepository.findReservationsByDateRange(start, end);
    }

    @Transactional
    public MaterialReservation reserve(MaterialReservationDTO dto) {
        if (!UserContext.hasRole(RoleType.DOCTOR_ASSISTANT)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有医生助理可以进行耗材预留");
        }

        CustomerProject project = customerProjectRepository.findById(dto.getCustomerProjectId())
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + dto.getCustomerProjectId()));

        if (project.getStatus() != ProjectStatus.SCHEDULED && project.getStatus() != ProjectStatus.CONFIRMED) {
            throw new BusinessException(ResultCode.INVALID_STATUS_TRANSITION,
                    "当前状态不允许预留耗材: " + project.getStatus().getDisplayName());
        }

        Material material = materialRepository.findById(dto.getMaterialId())
                .orElseThrow(() -> new IllegalArgumentException("耗材不存在: " + dto.getMaterialId()));

        if (material.getStatus() != MaterialStatus.AVAILABLE) {
            throw new BusinessException(ResultCode.MATERIAL_INSUFFICIENT,
                    "耗材状态不允许预留: " + material.getStatus().getDisplayName());
        }

        if (material.getStockQuantity() < dto.getQuantity()) {
            throw new BusinessException(ResultCode.MATERIAL_INSUFFICIENT,
                    String.format("库存不足，现有：%d，需要：%d", material.getStockQuantity(), dto.getQuantity()));
        }

        material.setStockQuantity(material.getStockQuantity() - dto.getQuantity());
        materialRepository.save(material);

        Employee currentUser = UserContext.getCurrentEmployee();
        MaterialReservation reservation = MaterialReservation.builder()
                .customerProject(project)
                .material(material)
                .quantity(dto.getQuantity())
                .status(MaterialStatus.RESERVED)
                .reservedAt(LocalDateTime.now())
                .reservedBy(currentUser)
                .remark(dto.getRemark())
                .build();

        MaterialReservation saved = materialReservationRepository.save(reservation);

        if (project.getStatus() == ProjectStatus.SCHEDULED) {
            project.setStatus(ProjectStatus.MATERIAL_RESERVED);
            customerProjectRepository.save(project);
            historyNoteService.addStatusChangeNote(project.getId(),
                    ProjectStatus.SCHEDULED.getDisplayName(),
                    ProjectStatus.MATERIAL_RESERVED.getDisplayName(),
                    "耗材已完成预留");
        }

        historyNoteService.addMaterialNote(project.getId(), material.getName(), dto.getQuantity(), "已预留");

        log.info("耗材预留成功 - 项目ID: {}, 耗材: {}, 数量: {}, 操作人: {}",
                project.getId(), material.getName(), dto.getQuantity(), currentUser.getName());

        return saved;
    }

    @Transactional
    public MaterialReservation confirmUsed(Long reservationId) {
        if (!UserContext.hasRole(RoleType.DOCTOR_ASSISTANT)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有医生助理可以确认耗材使用");
        }

        MaterialReservation reservation = materialReservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("预留记录不存在: " + reservationId));

        if (reservation.getStatus() != MaterialStatus.RESERVED) {
            throw new BusinessException(ResultCode.INVALID_OPERATION,
                    "当前状态不允许确认使用: " + reservation.getStatus().getDisplayName());
        }

        reservation.setStatus(MaterialStatus.USED);
        reservation.setUsedAt(LocalDateTime.now());
        MaterialReservation saved = materialReservationRepository.save(reservation);

        historyNoteService.addMaterialNote(reservation.getCustomerProject().getId(),
                reservation.getMaterial().getName(), reservation.getQuantity(), "已使用");

        return saved;
    }

    @Transactional
    public MaterialReservation cancelReservation(Long reservationId, String reason) {
        if (!UserContext.hasRole(RoleType.DOCTOR_ASSISTANT)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有医生助理可以取消耗材预留");
        }

        MaterialReservation reservation = materialReservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("预留记录不存在: " + reservationId));

        if (reservation.getStatus() != MaterialStatus.RESERVED) {
            throw new BusinessException(ResultCode.INVALID_OPERATION,
                    "当前状态不允许取消预留: " + reservation.getStatus().getDisplayName());
        }

        Material material = reservation.getMaterial();
        material.setStockQuantity(material.getStockQuantity() + reservation.getQuantity());
        materialRepository.save(material);

        reservation.setStatus(MaterialStatus.AVAILABLE);
        MaterialReservation saved = materialReservationRepository.save(reservation);

        historyNoteService.addMaterialNote(reservation.getCustomerProject().getId(),
                material.getName(), reservation.getQuantity(), "已取消预留，原因：" + reason);

        return saved;
    }

    @Transactional
    public void autoReserveByProjectMaterials(Long projectId) {
        CustomerProject project = customerProjectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + projectId));

        projectMaterialRepository.findByProjectId(project.getProject().getId())
                .forEach(pm -> {
                    try {
                        MaterialReservationDTO dto = new MaterialReservationDTO();
                        dto.setCustomerProjectId(projectId);
                        dto.setMaterialId(pm.getMaterial().getId());
                        dto.setQuantity(pm.getQuantity());
                        dto.setRemark("系统自动根据项目配置预留");
                        reserve(dto);
                    } catch (Exception e) {
                        log.warn("自动预留耗材失败 - 项目ID: {}, 耗材: {}, 原因: {}",
                                projectId, pm.getMaterial().getName(), e.getMessage());
                    }
                });
    }
}
