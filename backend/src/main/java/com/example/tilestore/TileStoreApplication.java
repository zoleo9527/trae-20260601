package com.example.tilestore;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.tilestore.mapper")
public class TileStoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(TileStoreApplication.class, args);
    }
}