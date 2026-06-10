package com.parking.service;

import com.parking.dto.PageResult;
import com.parking.entity.MonthlyRental;
import com.parking.repository.MonthlyRentalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MonthlyRentalService {

    private final MonthlyRentalRepository monthlyRentalRepository;

    public PageResult<MonthlyRental> queryRentals(String plateNumber, Long parkingLotId, Boolean active, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MonthlyRental> pageResult = monthlyRentalRepository.findByFilters(
                plateNumber, parkingLotId, active, pageRequest);
        return PageResult.of(pageResult);
    }

    public boolean isMonthlyRental(String plateNumber, Long parkingLotId) {
        return monthlyRentalRepository.findByPlateNumberAndParkingLotIdAndActiveTrue(plateNumber, parkingLotId)
                .isPresent();
    }
}
