package com.park.decoration.service;

import com.park.decoration.dto.*;

import java.util.List;

public interface DecorationApplicationService {

    ApiResponse<DecorationApplicationDTO> submitApplication(DecorationApplicationRequest request);

    DecorationApplicationDTO getApplicationById(Long id);

    DecorationApplicationDTO getApplicationByNo(String applicationNo);

    ApplicationDetailDTO getApplicationDetail(Long id);

    List<DecorationApplicationDTO> listApplications(String status);

    DecorationApplicationDTO processApplication(Long id, ApplicationProcessRequest request);

    DashboardOverviewDTO getDashboardOverview();
}
