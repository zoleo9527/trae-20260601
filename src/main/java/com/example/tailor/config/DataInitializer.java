package com.example.tailor.config;

import com.example.tailor.entity.*;
import com.example.tailor.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CustomerRepository customerRepository;
    private final FabricCardRepository fabricCardRepository;
    private final OrderRepository orderRepository;
    private final MeasurementRepository measurementRepository;

    public DataInitializer(CustomerRepository customerRepository, 
                          FabricCardRepository fabricCardRepository,
                          OrderRepository orderRepository,
                          MeasurementRepository measurementRepository) {
        this.customerRepository = customerRepository;
        this.fabricCardRepository = fabricCardRepository;
        this.orderRepository = orderRepository;
        this.measurementRepository = measurementRepository;
    }

    @Override
    public void run(String... args) {
        if (customerRepository.count() == 0) {
            Customer customer = new Customer();
            customer.setName("张三");
            customer.setPhone("13800138001");
            customer.setAddress("北京市朝阳区");
            customerRepository.save(customer);
            log.info("初始化客户数据");
        }

        if (fabricCardRepository.count() == 0) {
            FabricCard fabricCard = new FabricCard();
            fabricCard.setFabricCode("FAB001");
            fabricCard.setFabricName("高级羊毛");
            fabricCard.setFabricType("羊毛");
            fabricCard.setColor("深蓝色");
            fabricCard.setPattern("纯色");
            fabricCard.setWidth(1.5);
            fabricCard.setDescription("意大利进口高级羊毛面料");
            fabricCardRepository.save(fabricCard);
            log.info("初始化面料卡数据");
        }

        if (orderRepository.count() == 0) {
            Customer customer = customerRepository.findAll().get(0);
            FabricCard fabricCard = fabricCardRepository.findAll().get(0);

            Order order = new Order();
            order.setOrderNo("ORD" + System.currentTimeMillis());
            order.setCustomer(customer);
            order.setFabricCard(fabricCard);
            order.setProductName("定制西装");
            order.setProductType("西装");
            order.setPrice(new BigDecimal("2999.00"));
            order.setOrderDate(LocalDateTime.now());
            order.setExpectedDeliveryDate(LocalDateTime.now().plusDays(15));
            orderRepository.save(order);
            log.info("初始化订单数据");

            Measurement measurement = new Measurement();
            measurement.setOrder(order);
            measurement.setMeasurerId(1L);
            measurement.setMeasurerName("李量体师");
            measurement.setBust(96.0);
            measurement.setWaist(80.0);
            measurement.setHips(92.0);
            measurement.setShoulderWidth(46.0);
            measurement.setSleeveLength(62.0);
            measurement.setArmhole(42.0);
            measurement.setBackLength(70.0);
            measurement.setFrontLength(68.0);
            measurement.setNeckCircumference(38.0);
            measurement.setWristCircumference(16.0);
            measurement.setThighCircumference(56.0);
            measurement.setKneeCircumference(38.0);
            measurement.setInseamLength(82.0);
            measurement.setOutseamLength(108.0);
            measurement.setMeasurementDate(LocalDateTime.now());
            measurement.setNotes("客户要求修身版型");
            measurementRepository.save(measurement);
            log.info("初始化量体数据");
        }

        log.info("数据初始化完成");
    }
}