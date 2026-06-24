package com.homelab.agent.model;

import java.util.List;
import java.util.Map;

public class MetricPayload {

    private String agentId;
    private String agentVersion;
    private String collectedAt;
    private int intervalSeconds;
    private Map<String, Object> metrics;
    private List<Map<String, Object>> containers;
    private List<Map<String, Object>> services;

    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }
    public String getAgentVersion() { return agentVersion; }
    public void setAgentVersion(String agentVersion) { this.agentVersion = agentVersion; }
    public String getCollectedAt() { return collectedAt; }
    public void setCollectedAt(String collectedAt) { this.collectedAt = collectedAt; }
    public int getIntervalSeconds() { return intervalSeconds; }
    public void setIntervalSeconds(int intervalSeconds) { this.intervalSeconds = intervalSeconds; }
    public Map<String, Object> getMetrics() { return metrics; }
    public void setMetrics(Map<String, Object> metrics) { this.metrics = metrics; }
    public List<Map<String, Object>> getContainers() { return containers; }
    public void setContainers(List<Map<String, Object>> containers) { this.containers = containers; }
    public List<Map<String, Object>> getServices() { return services; }
    public void setServices(List<Map<String, Object>> services) { this.services = services; }
}
