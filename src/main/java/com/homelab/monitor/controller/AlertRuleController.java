package com.homelab.monitor.controller;

import com.homelab.monitor.model.AlertRule;
import com.homelab.monitor.model.Service;
import com.homelab.monitor.repository.AlertRuleRepository;
import com.homelab.monitor.repository.ServiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alert-rules")
@RequiredArgsConstructor
public class AlertRuleController {

    private final AlertRuleRepository alertRuleRepository;
    private final ServiceRepository serviceRepository;

    @GetMapping
    public ResponseEntity<Page<AlertRule>> getAllRules(Pageable pageable) {
        return ResponseEntity.ok(alertRuleRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertRule> getRuleById(@PathVariable UUID id) {
        return ResponseEntity.ok(alertRuleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AlertRule not found with id: " + id)));
    }

    @PostMapping
    public ResponseEntity<AlertRule> createRule(@RequestBody Map<String, Object> body) {
        UUID serviceId = UUID.fromString((String) body.get("serviceId"));
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new EntityNotFoundException("Service not found with id: " + serviceId));

        AlertRule rule = AlertRule.builder()
                .service(service)
                .ruleType((String) body.get("ruleType"))
                .thresholdMs(body.get("thresholdMs") != null ? (Integer) body.get("thresholdMs") : null)
                .failureCount(body.get("failureCount") != null ? (Integer) body.get("failureCount") : null)
                .enabled(body.get("enabled") != null ? (Boolean) body.get("enabled") : true)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(alertRuleRepository.save(rule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlertRule> updateRule(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        AlertRule existing = alertRuleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AlertRule not found with id: " + id));

        if (body.containsKey("ruleType")) {
            existing.setRuleType((String) body.get("ruleType"));
        }
        if (body.containsKey("thresholdMs")) {
            existing.setThresholdMs((Integer) body.get("thresholdMs"));
        }
        if (body.containsKey("failureCount")) {
            existing.setFailureCount((Integer) body.get("failureCount"));
        }
        if (body.containsKey("enabled")) {
            existing.setEnabled((Boolean) body.get("enabled"));
        }
        if (body.containsKey("serviceId")) {
            UUID serviceId = UUID.fromString((String) body.get("serviceId"));
            Service service = serviceRepository.findById(serviceId)
                    .orElseThrow(() -> new EntityNotFoundException("Service not found with id: " + serviceId));
            existing.setService(service);
        }
        return ResponseEntity.ok(alertRuleRepository.save(existing));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<AlertRule> toggleRule(@PathVariable UUID id) {
        AlertRule rule = alertRuleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AlertRule not found with id: " + id));
        rule.setEnabled(!rule.isEnabled());
        return ResponseEntity.ok(alertRuleRepository.save(rule));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable UUID id) {
        if (!alertRuleRepository.existsById(id)) {
            throw new EntityNotFoundException("AlertRule not found with id: " + id);
        }
        alertRuleRepository.deleteById(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
