package com.homelab.monitor.controller;

import com.homelab.monitor.model.HealthCheck;
import com.homelab.monitor.model.Service;
import com.homelab.monitor.repository.HealthCheckRepository;
import com.homelab.monitor.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final HealthCheckRepository healthCheckRepository;
    private final ServiceRepository serviceRepository;

    @GetMapping("/service/{id}")
    public ResponseEntity<Page<HealthCheck>> getHealthHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
                healthCheckRepository.findByServiceIdOrderByCheckedAtDesc(id, PageRequest.of(page, size)));
    }

    @GetMapping("/latest")
    public ResponseEntity<List<Map<String, Object>>> getLatestHealth() {
        List<Service> services = serviceRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Service service : services) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("serviceId", service.getId());
            entry.put("serviceName", service.getName());
            entry.put("serviceType", service.getServiceType());
            entry.put("active", service.isActive());

            healthCheckRepository.findFirstByServiceIdOrderByCheckedAtDesc(service.getId())
                    .ifPresentOrElse(check -> {
                        entry.put("status", check.getStatus());
                        entry.put("responseTimeMs", check.getResponseTimeMs());
                        entry.put("httpStatus", check.getHttpStatus());
                        entry.put("errorMessage", check.getErrorMessage());
                        entry.put("checkedAt", check.getCheckedAt());
                    }, () -> {
                        entry.put("status", "UNKNOWN");
                        entry.put("responseTimeMs", null);
                        entry.put("httpStatus", null);
                        entry.put("errorMessage", null);
                        entry.put("checkedAt", null);
                    });

            result.add(entry);
        }

        return ResponseEntity.ok(result);
    }
}
