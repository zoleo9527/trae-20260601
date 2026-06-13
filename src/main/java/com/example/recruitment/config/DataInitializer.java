
package com.example.recruitment.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final DataSource dataSource;

    @PostConstruct
    public void initialize() throws IOException {
        ClassPathResource resource = new ClassPathResource("schema.sql");
        if (resource.exists()) {
            ScriptUtils.executeSqlScript(dataSource.getConnection(), resource);
        }
    }
}
