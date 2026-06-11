package com.park.decoration.service;

import com.park.decoration.dto.EntryPermitDTO;
import com.park.decoration.dto.EntryPermitRequest;

import java.util.List;

public interface EntryPermitService {

    EntryPermitDTO issuePermit(EntryPermitRequest request);

    EntryPermitDTO getPermitById(Long id);

    EntryPermitDTO getPermitByNo(String permitNo);

    List<EntryPermitDTO> getPermitsByApplicationId(Long applicationId);

    EntryPermitDTO getLatestPermit(Long applicationId);

    EntryPermitDTO revokePermit(Long id, String reason, String operator);
}
