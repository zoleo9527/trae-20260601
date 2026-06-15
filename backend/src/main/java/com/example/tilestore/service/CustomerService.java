package com.example.tilestore.service;

import com.example.tilestore.common.BusinessException;
import com.example.tilestore.common.ErrorCode;
import com.example.tilestore.entity.Customer;
import com.example.tilestore.mapper.CustomerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerMapper customerMapper;

    public Customer getOrCreateCustomer(String name, String phone, String address, String remark) {
        Customer existing = customerMapper.findByPhone(phone);
        if (existing != null) {
            return existing;
        }
        Customer customer = new Customer();
        customer.setName(name);
        customer.setPhone(phone);
        customer.setAddress(address);
        customer.setRemark(remark);
        customerMapper.insert(customer);
        return customer;
    }

    public Customer getCustomerById(Long customerId) {
        Customer customer = customerMapper.selectById(customerId);
        if (customer == null) {
            throw new BusinessException(ErrorCode.CUSTOMER_NOT_FOUND);
        }
        return customer;
    }
}