package com.homelab.monitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricPushRequest {
    private String agentId;
    private String hostId;
    private String agentVersion;
    private LocalDateTime collectedAt;
    private Integer intervalSeconds;
    private Object host;
    private Object metrics;
    private Object services;
    private Object containers;
    private Object custom;
}
