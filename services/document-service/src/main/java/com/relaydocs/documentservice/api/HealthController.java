package com.relaydocs.documentservice.api;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {
    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "document-service", "status", "ok"));
    }

    @GetMapping("/live")
    public ResponseEntity<Map<String, String>> liveness() {
        return ResponseEntity.ok(Map.of("service", "document-service", "status", "ok"));
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, String>> readiness() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok(Map.of("service", "document-service", "status", "ok"));
        } catch (Exception exception) {
            return ResponseEntity.status(503)
                .body(Map.of("service", "document-service", "status", "degraded"));
        }
    }
}
