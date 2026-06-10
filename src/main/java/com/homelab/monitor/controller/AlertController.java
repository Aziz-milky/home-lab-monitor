package com.homelab.monitor.controller;

import com.homelab.monitor.model.Alert;
import com.homelab.monitor.repository.AlertRepository;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertRepository alertRepository;

    @GetMapping
    public ResponseEntity<Page<Alert>> getAlerts(
            @RequestParam(required = false) Boolean acknowledged,
            Pageable pageable) {
        if (acknowledged != null) {
            return ResponseEntity.ok(
                    alertRepository.findByAcknowledgedOrderByTriggeredAtDesc(acknowledged, pageable));
        }
        return ResponseEntity.ok(alertRepository.findAllByOrderByTriggeredAtDesc(pageable));
    }

    @PatchMapping("/{id}/acknowledge")
    public ResponseEntity<Alert> acknowledgeAlert(@PathVariable UUID id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Alert not found with id: " + id));
        alert.setAcknowledged(!alert.isAcknowledged());
        alert.setAcknowledgedAt(alert.isAcknowledged() ? LocalDateTime.now() : null);
        return ResponseEntity.ok(alertRepository.save(alert));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable UUID id) {
        if (!alertRepository.existsById(id)) {
            throw new EntityNotFoundException("Alert not found with id: " + id);
        }
        alertRepository.deleteById(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
