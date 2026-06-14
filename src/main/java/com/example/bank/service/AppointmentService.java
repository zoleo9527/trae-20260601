package com.example.bank.service;

import com.example.bank.dto.request.AppointmentCreateRequest;
import com.example.bank.dto.response.AppointmentResponse;

import java.util.List;

public interface AppointmentService {

    AppointmentResponse createAppointment(AppointmentCreateRequest request);

    AppointmentResponse getAppointmentById(Long id);

    AppointmentResponse getAppointmentByNo(String appointmentNo);

    List<AppointmentResponse> getAllAppointments();

    List<AppointmentResponse> getAppointmentsByStatus(String status);

    List<AppointmentResponse> getPendingAppointments();

    AppointmentResponse checkIn(Long id);

    AppointmentResponse assignToUser(Long appointmentId, Long userId, String windowNo);

    AppointmentResponse startProcessing(Long id);

    AppointmentResponse markMaterialIncomplete(Long id, String missingDocs, String remarks);

    AppointmentResponse markDueDiligencePending(Long id, String pendingItems, String remarks);

    AppointmentResponse recordComplaint(Long id, String complaintReason, String remarks);

    AppointmentResponse resolveMaterialIssue(Long id, String resolvedDocs, String remarks);

    AppointmentResponse resolveDueDiligence(Long id, String completedItems, String remarks);

    AppointmentResponse resolveComplaint(Long id, String resolution, String remarks);

    AppointmentResponse complete(Long id, String remarks);

    AppointmentResponse cancel(Long id, String reason);

    List<AppointmentResponse> getAppointmentsForUser(Long userId);

    List<AppointmentResponse> searchByKeyword(String keyword);
}