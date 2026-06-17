package com.homelab.monitor.service;

import com.homelab.monitor.dto.DiagnosticIssue;
import com.homelab.monitor.dto.DiagnosticReport;
import com.homelab.monitor.model.Alert;
import com.homelab.monitor.model.HealthCheck;
import com.homelab.monitor.model.Service;
import com.homelab.monitor.repository.AlertRepository;
import com.homelab.monitor.repository.HealthCheckRepository;
import com.homelab.monitor.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@org.springframework.stereotype.Service
public class DiagnosticService {

    private final HealthCheckRepository healthCheckRepository;
    private final ServiceRepository serviceRepository;
    private final AlertRepository alertRepository;
    private final OllamaClient ollamaClient;

    public List<DiagnosticReport> getAllReports() {
        List<Service> services = serviceRepository.findAll();
        return services.stream()
                .map(this::analyzeService)
                .sorted(Comparator.comparingInt(DiagnosticReport::getHealthScore))
                .collect(Collectors.toList());
    }

    public DiagnosticReport getReport(UUID serviceId) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found: " + serviceId));
        return analyzeService(service);
    }

    public String getAiInsight(UUID serviceId) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found: " + serviceId));
        List<HealthCheck> recent = healthCheckRepository
                .findByServiceIdOrderByCheckedAtDesc(service.getId(), PageRequest.of(0, 50))
                .getContent();
        List<Alert> alerts = alertRepository.findByAcknowledgedOrderByTriggeredAtDesc(false)
                .stream()
                .filter(a -> a.getService().getId().equals(serviceId))
                .collect(Collectors.toList());
        return ollamaClient.analyze(service, recent, alerts);
    }

    private DiagnosticReport analyzeService(Service service) {
        List<HealthCheck> checks = healthCheckRepository
                .findByServiceIdOrderByCheckedAtDesc(service.getId(), PageRequest.of(0, 200))
                .getContent();

        List<Alert> activeAlerts = alertRepository.findByAcknowledgedOrderByTriggeredAtDesc(false)
                .stream()
                .filter(a -> a.getService().getId().equals(service.getId()))
                .collect(Collectors.toList());

        String currentStatus = checks.isEmpty() ? "UNKNOWN" : checks.get(0).getStatus();

        int healthScore = computeHealthScore(checks, activeAlerts);
        double uptime1h = computeUptimeSince(checks, LocalDateTime.now().minusHours(1));
        double uptime24h = computeUptimeSince(checks, LocalDateTime.now().minusHours(24));
        double uptime7d = computeUptimeSince(checks, LocalDateTime.now().minusDays(7));
        double avgResponseTime = checks.stream()
                .filter(c -> c.getResponseTimeMs() > 0)
                .mapToInt(HealthCheck::getResponseTimeMs)
                .average()
                .orElse(0);

        boolean flapping = detectFlapping(checks);
        double flappingRate = computeFlappingRate(checks);
        String trend = computeTrend(checks);
        double trendSlope = computeTrendSlope(checks);
        double anomalyScore = computeAnomalyScore(checks);

        List<DiagnosticIssue> issues = new ArrayList<>();

        if (currentStatus.equals("DOWN")) {
            issues.add(DiagnosticIssue.builder()
                    .severity("CRITICAL")
                    .type("OUTAGE")
                    .description("Service is currently down")
                    .suggestedAction("Check if the service process is running and accessible at " + service.getCheckUrl())
                    .build());
        }

        if (flapping) {
            issues.add(DiagnosticIssue.builder()
                    .severity("WARNING")
                    .type("FLAPPING")
                    .description(String.format("Service status changed %.0f times in recent checks", flappingRate))
                    .suggestedAction("Check for intermittent connectivity issues or resource exhaustion")
                    .build());
        }

        if (trend.equals("degrading")) {
            issues.add(DiagnosticIssue.builder()
                    .severity("WARNING")
                    .type("TREND")
                    .description(String.format("Response time increasing (slope: +%.1f ms/check)", trendSlope))
                    .suggestedAction("Investigate for memory leaks, increased load, or disk I/O issues")
                    .build());
        }

        if (anomalyScore > 0.3) {
            issues.add(DiagnosticIssue.builder()
                    .severity("INFO")
                    .type("ANOMALY")
                    .description(String.format("Response time variance is high (score: %.2f)", anomalyScore))
                    .suggestedAction("Check for periodic spikes caused by background jobs or cron tasks")
                    .build());
        }

        if (uptime24h < 0.95) {
            issues.add(DiagnosticIssue.builder()
                    .severity("WARNING")
                    .type("RELIABILITY")
                    .description(String.format("24h uptime is %.1f%% (below 95%% threshold)", uptime24h * 100))
                    .suggestedAction("Review recent outages and consider adding redundancy")
                    .build());
        }

        activeAlerts.stream()
                .filter(a -> !issues.stream().anyMatch(i -> i.getDescription().contains(a.getMessage())))
                .findFirst()
                .ifPresent(a -> issues.add(DiagnosticIssue.builder()
                        .severity(a.getSeverity().name())
                        .type("ALERT")
                        .description(a.getMessage())
                        .suggestedAction("Acknowledge the alert and investigate the root cause")
                        .build()));

        String aiInsight = null;
        boolean aiAvailable = ollamaClient.isAvailable();
        if (aiAvailable) {
            try {
                aiInsight = ollamaClient.analyze(service, checks, activeAlerts);
            } catch (Exception e) {
                aiInsight = "AI analysis unavailable: " + e.getMessage();
            }
        }

        return DiagnosticReport.builder()
                .serviceId(service.getId().toString())
                .serviceName(service.getName())
                .serviceType(service.getServiceType().name())
                .currentStatus(currentStatus)
                .healthScore(healthScore)
                .uptime1h(uptime1h)
                .uptime24h(uptime24h)
                .uptime7d(uptime7d)
                .avgResponseTimeMs(avgResponseTime)
                .totalChecks(checks.size())
                .flapping(flapping)
                .flappingRate(flappingRate)
                .trend(trend)
                .trendSlope(trendSlope)
                .anomalyScore(anomalyScore)
                .activeAlerts(activeAlerts.size())
                .issues(issues)
                .aiInsight(aiInsight)
                .aiAvailable(aiAvailable)
                .build();
    }

    private int computeHealthScore(List<HealthCheck> checks, List<Alert> alerts) {
        if (checks.isEmpty()) return 50;
        double uptime = computeUptimeSince(checks, LocalDateTime.now().minusDays(7));
        double uptimeScore = uptime * 60;
        double alertPenalty = Math.min(alerts.size() * 5, 20);
        double responsePenalty = 0;
        if (!checks.isEmpty()) {
            double avg = checks.stream().filter(c -> c.getResponseTimeMs() > 0)
                    .mapToInt(HealthCheck::getResponseTimeMs).average().orElse(0);
            if (avg > 5000) responsePenalty = 15;
            else if (avg > 2000) responsePenalty = 10;
            else if (avg > 1000) responsePenalty = 5;
        }
        int score = (int) Math.round(uptimeScore - alertPenalty - responsePenalty);
        return Math.max(0, Math.min(100, score));
    }

    private double computeUptimeSince(List<HealthCheck> checks, LocalDateTime since) {
        List<HealthCheck> relevant = checks.stream()
                .filter(c -> c.getCheckedAt().isAfter(since))
                .collect(Collectors.toList());
        if (relevant.isEmpty()) return 1.0;
        long up = relevant.stream().filter(c -> c.getStatus().equals("UP")).count();
        return (double) up / relevant.size();
    }

    private boolean detectFlapping(List<HealthCheck> checks) {
        List<HealthCheck> recent = checks.stream().limit(20).collect(Collectors.toList());
        if (recent.size() < 6) return false;
        int changes = 0;
        for (int i = 1; i < recent.size(); i++) {
            if (!recent.get(i).getStatus().equals(recent.get(i - 1).getStatus())) {
                changes++;
            }
        }
        return changes >= 4;
    }

    private double computeFlappingRate(List<HealthCheck> checks) {
        List<HealthCheck> recent = checks.stream().limit(20).collect(Collectors.toList());
        if (recent.size() < 4) return 0;
        int changes = 0;
        for (int i = 1; i < recent.size(); i++) {
            if (!recent.get(i).getStatus().equals(recent.get(i - 1).getStatus())) {
                changes++;
            }
        }
        return changes;
    }

    private String computeTrend(List<HealthCheck> checks) {
        List<HealthCheck> recent = checks.stream()
                .filter(c -> c.getResponseTimeMs() > 0)
                .limit(30)
                .collect(Collectors.toList());
        if (recent.size() < 5) return "stable";
        double slope = computeTrendSlope(checks);
        if (slope > 5) return "degrading";
        if (slope < -5) return "improving";
        return "stable";
    }

    private double computeTrendSlope(List<HealthCheck> checks) {
        List<HealthCheck> recent = checks.stream()
                .filter(c -> c.getResponseTimeMs() > 0)
                .limit(30)
                .collect(Collectors.toList());
        if (recent.size() < 5) return 0;
        int n = recent.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += recent.get(i).getResponseTimeMs();
            sumXY += i * recent.get(i).getResponseTimeMs();
            sumX2 += i * i;
        }
        double denominator = n * sumX2 - sumX * sumX;
        if (denominator == 0) return 0;
        return (n * sumXY - sumX * sumY) / denominator;
    }

    private double computeAnomalyScore(List<HealthCheck> checks) {
        List<HealthCheck> valid = checks.stream()
                .filter(c -> c.getResponseTimeMs() > 0)
                .collect(Collectors.toList());
        if (valid.size() < 5) return 0;
        double mean = valid.stream().mapToInt(HealthCheck::getResponseTimeMs).average().orElse(0);
        double variance = valid.stream()
                .mapToDouble(c -> Math.pow(c.getResponseTimeMs() - mean, 2))
                .average()
                .orElse(0);
        double stdDev = Math.sqrt(variance);
        if (stdDev == 0) return 0;
        long outliers = valid.stream()
                .filter(c -> Math.abs(c.getResponseTimeMs() - mean) > 2 * stdDev)
                .count();
        return (double) outliers / valid.size();
    }
}
