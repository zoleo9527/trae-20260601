package com.example.tilestore.service;

import com.example.tilestore.common.BusinessException;
import com.example.tilestore.common.ErrorCode;
import com.example.tilestore.dto.response.ProductResponse;
import com.example.tilestore.entity.Product;
import com.example.tilestore.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductMapper productMapper;

    public List<ProductResponse> listProducts(String category) {
        List<Product> products;
        if (category != null && !category.isEmpty()) {
            products = productMapper.findByCategory(category);
        } else {
            products = productMapper.findAllActive();
        }
        return products.stream()
                .map(this::buildResponse)
                .collect(Collectors.toList());
    }

    public ProductResponse getProduct(Long id) {
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        return buildResponse(product);
    }

    private ProductResponse buildResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setCode(product.getCode());
        response.setName(product.getName());
        response.setCategory(product.getCategory());
        response.setSpecification(product.getSpecification());
        response.setColor(product.getColor());
        response.setPrice(product.getPrice());
        response.setStock(product.getStock());
        return response;
    }
}