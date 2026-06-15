package com.example.tilestore.controller;

import com.example.tilestore.common.ApiResponse;
import com.example.tilestore.dto.response.ProductResponse;
import com.example.tilestore.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<List<ProductResponse>> list(@RequestParam(required = false) String category) {
        List<ProductResponse> response = productService.listProducts(category);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> get(@PathVariable Long id) {
        ProductResponse response = productService.getProduct(id);
        return ApiResponse.success(response);
    }
}