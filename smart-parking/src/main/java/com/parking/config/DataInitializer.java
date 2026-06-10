package com.parking.config;

import com.parking.dto.GateFaultHandleRequest;
import com.parking.dto.RemoteReleaseReviewRequest;
import com.parking.entity.*;
import com.parking.enums.FaultStatus;
import com.parking.repository.*;
import com.parking.service.GateFaultService;
import com.parking.service.RemoteReleaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ParkingLotRepository parkingLotRepository;
    private final GateRepository gateRepository;
    private final MonthlyRentalRepository monthlyRentalRepository;
    private final GateFaultRepository gateFaultRepository;
    private final RemoteReleaseRepository remoteReleaseRepository;
    private final OperationRemarkRepository operationRemarkRepository;
    private final ParkingLogRepository parkingLogRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final GateFaultService gateFaultService;
    private final RemoteReleaseService remoteReleaseService;

    @Override
    @Transactional
    public void run(String... args) {
        if (parkingLotRepository.count() > 0) {
            log.info("种子数据已存在，跳过初始化");
            return;
        }

        log.info("===== 开始初始化种子数据 =====");

        List<ParkingLot> lots = initParkingLots();
        List<Gate> gates = initGates(lots);
        List<MonthlyRental> rentals = initMonthlyRentals(lots);
        initParkingLogs(gates);
        initNormalFlow(gates);
        initExceptionSamples(gates);
        initTimeoutSample(gates);
        initFrequencyAlertSample(gates);
        initHandedOverWithInheritedRemark(gates);
        initRejectedReleaseSample(gates);

        log.info("===== 种子数据初始化完成 =====");
    }

    private List<ParkingLot> initParkingLots() {
        List<ParkingLot> lots = new ArrayList<>();

        ParkingLot lot1 = new ParkingLot();
        lot1.setName("万达广场停车场");
        lot1.setAddress("建国路88号");
        lot1.setContactPhone("010-88880001");
        lots.add(parkingLotRepository.save(lot1));

        ParkingLot lot2 = new ParkingLot();
        lot2.setName("银泰中心停车场");
        lot2.setAddress("长安街12号");
        lot2.setContactPhone("010-88880002");
        lots.add(parkingLotRepository.save(lot2));

        return lots;
    }

    private List<Gate> initGates(List<ParkingLot> lots) {
        List<Gate> gates = new ArrayList<>();

        gates.add(createGate("WJ-ENT-01", "万达入口1号道闸", "ENTRY", lots.get(0)));
        gates.add(createGate("WJ-EXT-01", "万达出口1号道闸", "EXIT", lots.get(0)));
        gates.add(createGate("WJ-EXT-02", "万达出口2号道闸", "EXIT", lots.get(0)));
        gates.add(createGate("YT-ENT-01", "银泰入口1号道闸", "ENTRY", lots.get(1)));
        gates.add(createGate("YT-EXT-01", "银泰出口1号道闸", "EXIT", lots.get(1)));

        return gateRepository.saveAll(gates);
    }

    private Gate createGate(String code, String name, String direction, ParkingLot lot) {
        Gate gate = new Gate();
        gate.setGateCode(code);
        gate.setGateName(name);
        gate.setDirection(direction);
        gate.setParkingLot(lot);
        gate.setOnline(true);
        return gate;
    }

    private List<MonthlyRental> initMonthlyRentals(List<ParkingLot> lots) {
        List<MonthlyRental> rentals = new ArrayList<>();

        rentals.add(createRental("京A12345", lots.get(0).getId(), "张伟", "13800001111",
                LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31)));
        rentals.add(createRental("京B67890", lots.get(0).getId(), "李娜", "13800002222",
                LocalDate.of(2025, 3, 1), LocalDate.of(2026, 2, 28)));
        rentals.add(createRental("京C11111", lots.get(1).getId(), "王强", "13800003333",
                LocalDate.of(2025, 6, 1), LocalDate.of(2025, 5, 31)));
        rentals.add(createRental("京D22222", lots.get(0).getId(), "赵敏", "13800004444",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31)));

        return monthlyRentalRepository.saveAll(rentals);
    }

    private MonthlyRental createRental(String plate, Long lotId, String name, String phone,
                                        LocalDate start, LocalDate end) {
        MonthlyRental rental = new MonthlyRental();
        rental.setPlateNumber(plate);
        rental.setParkingLotId(lotId);
        rental.setOwnerName(name);
        rental.setOwnerPhone(phone);
        rental.setStartDate(start);
        rental.setEndDate(end);
        rental.setActive(end.isAfter(LocalDate.now()));
        rental.setCreatedAt(LocalDateTime.now());
        return rental;
    }

    private void initParkingLogs(List<Gate> gates) {
        List<ParkingLog> logs = new ArrayList<>();

        logs.add(createLog(gates.get(0), "京A12345", "ENTRY", "月租车辆正常入场"));
        logs.add(createLog(gates.get(1), "京A12345", "EXIT", "月租车辆正常出场"));
        logs.add(createLog(gates.get(0), "京E99999", "ENTRY", "临时车辆入场"));
        logs.add(createLog(gates.get(3), "京C11111", "ENTRY", "月租车辆正常入场"));
        logs.add(createLog(gates.get(1), "京F88888", "EXIT_FAIL", "道闸无法抬杆，车牌识别成功"));

        parkingLogRepository.saveAll(logs);
    }

    private ParkingLog createLog(Gate gate, String plate, String type, String detail) {
        ParkingLog log = new ParkingLog();
        log.setGate(gate);
        log.setPlateNumber(plate);
        log.setEventType(type);
        log.setEventTime(LocalDateTime.now().minusMinutes(30));
        log.setDetail(detail);
        return log;
    }

    private void initNormalFlow(List<Gate> gates) {
        GateFault fault = new GateFault();
        fault.setGate(gates.get(1));
        fault.setFaultType("CANNOT_LIFT");
        fault.setFaultDescription("出口1号道闸无法抬杆，电机有异响");
        fault.setReportedBy("巡检员-小王");
        fault.setReportedAt(LocalDateTime.now().minusHours(2));
        fault.setStatus(FaultStatus.PENDING);
        gateFaultRepository.save(fault);

        GateFaultHandleRequest handleReq = new GateFaultHandleRequest();
        handleReq.setFaultId(fault.getId());
        handleReq.setHandlerName("维护员-老陈");
        handleReq.setHandlingRemark("电机碳刷磨损，临时手动抬杆放行，需更换碳刷。当前有一辆京E99999等待出场");
        handleReq.setNeedRemoteRelease(true);
        handleReq.setPlateNumber("京E99999");
        gateFaultService.handleFault(handleReq);
    }

    private void initExceptionSamples(List<Gate> gates) {
        GateFault fault2 = new GateFault();
        fault2.setGate(gates.get(2));
        fault2.setFaultType("SENSOR_ERROR");
        fault2.setFaultDescription("出口2号道闸地感线圈异常，车辆通过后道闸不落杆");
        fault2.setReportedBy("巡检员-小王");
        fault2.setReportedAt(LocalDateTime.now().minusHours(1));
        fault2.setStatus(FaultStatus.PENDING);
        gateFaultRepository.save(fault2);

        GateFaultHandleRequest handleReq2 = new GateFaultHandleRequest();
        handleReq2.setFaultId(fault2.getId());
        handleReq2.setHandlerName("维护员-老陈");
        handleReq2.setHandlingRemark("地感线圈断路，临时改为手动模式。京B67890月租车已在场内等待，需远程放行");
        handleReq2.setNeedRemoteRelease(true);
        handleReq2.setPlateNumber("京B67890");
        gateFaultService.handleFault(handleReq2);
    }

    private void initTimeoutSample(List<Gate> gates) {
        GateFault fault = new GateFault();
        fault.setGate(gates.get(4));
        fault.setFaultType("COMM_FAILURE");
        fault.setFaultDescription("银泰出口1号道闸通讯中断，无法远程控制");
        fault.setReportedBy("监控室-小李");
        fault.setReportedAt(LocalDateTime.now().minusHours(1).minusMinutes(45));
        fault.setStatus(FaultStatus.PENDING);
        gateFaultRepository.save(fault);

        AlertNotification alert = AlertNotification.faultTimeout(fault);
        alertNotificationRepository.save(alert);
    }

    private void initFrequencyAlertSample(List<Gate> gates) {
        for (int i = 0; i < 3; i++) {
            GateFault fault = new GateFault();
            fault.setGate(gates.get(0));
            fault.setFaultType("INTERMITTENT");
            fault.setFaultDescription("入口1号道闸间歇性故障，第" + (i + 1) + "次报修");
            fault.setReportedBy("巡检员-小王");
            fault.setReportedAt(LocalDateTime.now().minusHours(20 + i));
            fault.setStatus(FaultStatus.RESOLVED);
            fault.setResolvedBy("维护员-老陈");
            fault.setResolvedAt(LocalDateTime.now().minusHours(19 + i));
            fault.setHandlingRemark("第" + (i + 1) + "次修复，重启控制器后恢复");
            gateFaultRepository.save(fault);
        }

        AlertNotification alert = AlertNotification.abnormalFrequency(gates.get(0).getId(), 3);
        alert.setMessage("道闸[WJ-ENT-01]近期故障频发（3次），建议现场排查入口控制器");
        alertNotificationRepository.save(alert);
    }

    private void initHandedOverWithInheritedRemark(List<Gate> gates) {
        GateFault fault = new GateFault();
        fault.setGate(gates.get(3));
        fault.setFaultType("CANNOT_LIFT");
        fault.setFaultDescription("银泰入口1号道闸无法抬杆，春笋传感器故障");
        fault.setReportedBy("监控室-小李");
        fault.setReportedAt(LocalDateTime.now().minusMinutes(90));
        fault.setStatus(FaultStatus.PENDING);
        gateFaultRepository.save(fault);

        GateFaultHandleRequest handleReq = new GateFaultHandleRequest();
        handleReq.setFaultId(fault.getId());
        handleReq.setHandlerName("维护员-赵工");
        handleReq.setHandlingRemark("传感器损坏需更换，现场已手动抬杆，但系统未记录入场。京D22222月租车需补录入场记录");
        handleReq.setNeedRemoteRelease(true);
        handleReq.setPlateNumber("京D22222");
        gateFaultService.handleFault(handleReq);
    }

    private void initRejectedReleaseSample(List<Gate> gates) {
        GateFault fault = new GateFault();
        fault.setGate(gates.get(1));
        fault.setFaultType("CAMERA_OFFLINE");
        fault.setFaultDescription("出口1号道闸摄像头离线，无法识别车牌");
        fault.setReportedBy("监控室-小李");
        fault.setReportedAt(LocalDateTime.now().minusMinutes(120));
        fault.setStatus(FaultStatus.PENDING);
        gateFaultRepository.save(fault);

        GateFaultHandleRequest handleReq = new GateFaultHandleRequest();
        handleReq.setFaultId(fault.getId());
        handleReq.setHandlerName("维护员-老陈");
        handleReq.setHandlingRemark("摄像头电源线松动，已临时修复。京G55555等待出场");
        handleReq.setNeedRemoteRelease(true);
        handleReq.setPlateNumber("京G55555");
        gateFaultService.handleFault(handleReq);

        RemoteRelease release = remoteReleaseRepository.findByGateFaultId(fault.getId(),
                org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0);

        RemoteReleaseReviewRequest rejectReq = new RemoteReleaseReviewRequest();
        rejectReq.setReleaseId(release.getId());
        rejectReq.setReviewerName("客服-小周");
        rejectReq.setAction("REJECT");
        rejectReq.setReviewRemark("车牌京G55555不在月租名单中，且无入场记录，无法确认是否为该车场车辆，请现场核实");
        remoteReleaseService.reviewRelease(rejectReq);
    }
}
