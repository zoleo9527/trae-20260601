package com.example.bank.controller;

import com.example.bank.dto.request.AppointmentCreateRequest;
import com.example.bank.dto.response.AppointmentResponse;
import com.example.bank.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(@Valid @RequestBody AppointmentCreateRequest request) {
        return ResponseEntity.ok(appointmentService.createAppointment(request));
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<AppointmentResponse>> getPendingAppointments() {
        return ResponseEntity.ok(appointmentService.getPendingAppointments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<AppointmentResponse>> searchByKeyword(@RequestParam String keyword) {
        return ResponseEntity.ok(appointmentService.searchByKeyword(keyword));
    }

    @PostMapping("/{id}/check-in")
    public ResponseEntity<AppointmentResponse> checkIn(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.checkIn(id));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<AppointmentResponse> assignToUser(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String windowNo) {
        return ResponseEntity.ok(appointmentService.assignToUser(id, userId, windowNo));
    }

    @PostMapping("/{id}/start-processing")
    public ResponseEntity<AppointmentResponse> startProcessing(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.startProcessing(id));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> complete(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(appointmentService.complete(id, remarks));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancel(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(appointmentService.cancel(id, reason));
    }
}