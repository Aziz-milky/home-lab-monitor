package com.homelab.agent.service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import tools.jackson.databind.ObjectMapper;
import com.homelab.agent.client.SentinelApiClient;
import com.homelab.agent.collector.DockerMetricsCollector;
import com.homelab.agent.collector.SystemMetricsCollector;
import com.homelab.agent.config.AgentConfig;
import com.homelab.agent.model.AgentRegistrationResponse;
import com.homelab.agent.model.MetricPayload;

@Service
public class AgentLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(AgentLifecycleService.class);

    @Autowired
    private AgentConfig config;

    @Autowired
    private SentinelApiClient apiClient;

    @Autowired
    private SystemMetricsCollector systemCollector;

    @Autowired
    private DockerMetricsCollector dockerCollector;

    private final ObjectMapper mapper = new ObjectMapper();

    private String hostId;
    private String agentId;
    private String token;

    @PostConstruct
    public void init() {
        String serverUrl = config.getServer().getUrl();
        apiClient.setServerUrl(serverUrl);
        log.info("Sentinel Agent configured for server: {}", serverUrl);

        if (!loadState()) {
            register();
        }
    }

    @Scheduled(fixedDelayString = "${sentinel.agent.collection-interval-seconds:30}000")
    public void collectAndPush() {
        if (hostId == null || token == null) {
            log.warn("Not registered yet, skipping collection");
            return;
        }

        try {
            String collectedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            Map<String, Object> metrics = systemCollector.collect(config.getAgent().getHostname());
            List<Map<String, Object>> containers = List.of();

            if (config.getAgent().isDockerEnabled()) {
                containers = dockerCollector.collect(config.getAgent().getDockerSocket());
            }

            MetricPayload payload = new MetricPayload();
            payload.setAgentId(agentId);
            payload.setAgentVersion(config.getAgent().getVersion());
            payload.setCollectedAt(collectedAt);
            payload.setIntervalSeconds(config.getAgent().getCollectionIntervalSeconds());
            payload.setMetrics(metrics);
            payload.setContainers(containers.isEmpty() ? null : containers);

            apiClient.pushMetrics(hostId, token, payload);
        } catch (Exception e) {
            log.error("Collection/push failed: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedDelayString = "${sentinel.agent.heartbeat-interval-seconds:10}000")
    public void sendHeartbeat() {
        if (hostId == null || token == null) return;

        Map<String, Object> heartbeat = new HashMap<>();
        heartbeat.put("status", "OK");
        heartbeat.put("pendingBufferSize", 0);
        heartbeat.put("agentVersion", config.getAgent().getVersion());

        boolean ok = apiClient.sendHeartbeat(hostId, token, heartbeat);
        if (!ok) {
            log.warn("Heartbeat failed, attempting re-registration");
            register();
        }
    }

    @PreDestroy
    public void shutdown() {
        log.info("Agent shutting down, deregistering...");
        if (hostId != null && token != null) {
            apiClient.deregister(hostId, token);
        }
    }

    private void register() {
        try {
            Map<String, Object> sysInfo = systemCollector.collectSystemInfo();
            Map<String, Object> payload = new HashMap<>();
            payload.put("hostname", sysInfo.get("hostname"));
            payload.put("os", sysInfo.get("os") + " " + sysInfo.get("osVersion"));
            payload.put("arch", sysInfo.get("arch"));
            payload.put("hostType", "LINUX_SERVER");
            payload.put("name", config.getAgent().getName());
            payload.putAll(sysInfo);

            AgentRegistrationResponse resp = apiClient.register(payload);
            this.hostId = resp.getHostId();
            this.agentId = resp.getAgentId();
            this.token = resp.getToken();

            saveState();
            log.info("Registered with hostId={} agentId={}", hostId, agentId);
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage());
        }
    }

    private boolean loadState() {
        String envHostId = config.getAgent().getHostId();
        String envToken = config.getAgent().getToken();
        if (envHostId != null && !envHostId.isEmpty() && envToken != null && !envToken.isEmpty()) {
            this.hostId = envHostId;
            this.token = envToken;
            this.agentId = "from-env";
            log.info("Loaded credentials from environment/config");
            return true;
        }

        String stateFile = config.getAgent().getStateFile();
        File f = new File(stateFile);
        if (f.exists()) {
            try {
                String content = new String(Files.readAllBytes(Paths.get(stateFile)));
                @SuppressWarnings("unchecked")
                Map<String, String> state = mapper.readValue(content, Map.class);
                this.hostId = state.get("hostId");
                this.agentId = state.get("agentId");
                this.token = state.get("token");
                log.info("Loaded state from {}", stateFile);
                return true;
            } catch (Exception e) {
                log.warn("Failed to load state file: {}", e.getMessage());
            }
        }
        return false;
    }

    private void saveState() {
        String stateFile = config.getAgent().getStateFile();
        try {
            File f = new File(stateFile);
            f.getParentFile().mkdirs();
            Map<String, String> state = new HashMap<>();
            state.put("hostId", hostId);
            state.put("agentId", agentId);
            state.put("token", token);
            mapper.writerWithDefaultPrettyPrinter().writeValue(f, state);
            log.info("Saved state to {}", stateFile);
        } catch (Exception e) {
            log.warn("Failed to save state file: {}", e.getMessage());
        }
    }
}
