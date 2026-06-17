package com.homelab.monitor.controller;

import com.homelab.monitor.dto.DiagnosticReport;
import com.homelab.monitor.service.DiagnosticService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/diagnostics")
@RequiredArgsConstructor
public class DiagnosticController {

    private final DiagnosticService diagnosticService;

    @GetMapping
    public ResponseEntity<List<DiagnosticReport>> getAllReports() {
        return ResponseEntity.ok(diagnosticService.getAllReports());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiagnosticReport> getReport(@PathVariable UUID id) {
        return ResponseEntity.ok(diagnosticService.getReport(id));
    }

    @PostMapping("/ai/{id}")
    public ResponseEntity<String> getAiInsight(@PathVariable UUID id) {
        return ResponseEntity.ok(diagnosticService.getAiInsight(id));
    }
}
