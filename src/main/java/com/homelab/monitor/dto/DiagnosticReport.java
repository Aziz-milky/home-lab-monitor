package com.homelab.monitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosticReport {
    private String serviceId;
    private String serviceName;
    private String serviceType;
    private String currentStatus;

    private int healthScore;
    private double uptime1h;
    private double uptime24h;
    private double uptime7d;
    private double avgResponseTimeMs;
    private int totalChecks;

    private boolean flapping;
    private double flappingRate;
    private String trend;
    private double trendSlope;
    private double anomalyScore;

    private int activeAlerts;
    private List<DiagnosticIssue> issues;
    private String aiInsight;
    private boolean aiAvailable;
}
