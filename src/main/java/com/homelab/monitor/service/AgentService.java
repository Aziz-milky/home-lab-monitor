package com.homelab.monitor.service;

import tools.jackson.databind.ObjectMapper;
import com.homelab.monitor.dto.AgentRegistrationRequest;
import com.homelab.monitor.dto.AgentRegistrationResponse;
import com.homelab.monitor.dto.HeartbeatRequest;
import com.homelab.monitor.model.AgentHeartbeat;
import com.homelab.monitor.model.AgentStatus;
import com.homelab.monitor.model.Host;
import com.homelab.monitor.model.HostType;
import com.homelab.monitor.model.MetricSnapshot;
import com.homelab.monitor.repository.AgentHeartbeatRepository;
import com.homelab.monitor.repository.HostRepository;
import com.homelab.monitor.repository.MetricSnapshotRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@org.springframework.stereotype.Service
@Transactional
public class AgentService {

    private static final Logger log = LoggerFactory.getLogger(AgentService.class);
    private static final long STALE_THRESHOLD_SECONDS = 90;

    private final HostRepository hostRepository;
    private final MetricSnapshotRepository metricSnapshotRepository;
    private final AgentHeartbeatRepository agentHeartbeatRepository;
    private final MetricExtractorService metricExtractorService;
    private final ObjectMapper objectMapper;

    public AgentRegistrationResponse register(AgentRegistrationRequest request) {
        UUID agentId = UUID.randomUUID();
        String token = UUID.randomUUID().toString();

        Host host = Host.builder()
                .name(request.getName() != null ? request.getName() : request.getHostname())
                .agentId(agentId)
                .hostname(request.getHostname())
                .os(request.getOs())
                .arch(request.getArch())
                .kernelVersion(request.getKernelVersion())
                .hostType(request.getHostType() != null ? request.getHostType() : HostType.GENERIC)
                .ipAddress(request.getIpAddress())
                .agentStatus(AgentStatus.CONNECTED)
                .lastSeenAt(LocalDateTime.now())
                .authToken(token)
                .createdAt(LocalDateTime.now())
                .active(true)
                .build();

        host = hostRepository.save(host);
        log.info("Agent registered: id={}, hostname={}, token={}", host.getId(), host.getHostname(), token);

        return AgentRegistrationResponse.builder()
                .hostId(host.getId())
                .agentId(host.getAgentId())
                .token(token)
                .build();
    }

    public void ingestMetrics(UUID hostId, Map<String, Object> payload) {
        Host host = hostRepository.findById(hostId)
                .orElseThrow(() -> new EntityNotFoundException("Host not found: " + hostId));

        String agentVersion = payload.get("agentVersion") instanceof String v ? v : null;
        Object collectedAtObj = payload.get("collectedAt");
        LocalDateTime collectedAt = collectedAtObj != null
                ? LocalDateTime.parse(collectedAtObj.toString())
                : LocalDateTime.now();

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize metric payload for host {}: {}", hostId, e.getMessage());
            payloadJson = "{}";
        }

        MetricSnapshot snapshot = MetricSnapshot.builder()
                .host(host)
                .collectedAt(collectedAt)
                .receivedAt(LocalDateTime.now())
                .agentVersion(agentVersion)
                .payload(payloadJson)
                .build();

        metricSnapshotRepository.save(snapshot);

        metricExtractorService.extract(host, collectedAt, payload);

        host.setLastSeenAt(LocalDateTime.now());
        host.setAgentStatus(AgentStatus.CONNECTED);
        if (agentVersion != null) {
            host.setAgentVersion(agentVersion);
        }
        hostRepository.save(host);
    }

    public void processHeartbeat(UUID hostId, HeartbeatRequest request) {
        Host host = hostRepository.findById(hostId)
                .orElseThrow(() -> new EntityNotFoundException("Host not found: " + hostId));

        AgentHeartbeat heartbeat = AgentHeartbeat.builder()
                .host(host)
                .receivedAt(LocalDateTime.now())
                .agentVersion(request.getAgentVersion())
                .status(request.getStatus() != null ? request.getStatus() : AgentHeartbeat.HeartbeatStatus.OK)
                .pendingBufferSize(request.getPendingBufferSize())
                .build();

        agentHeartbeatRepository.save(heartbeat);

        host.setLastSeenAt(LocalDateTime.now());
        host.setAgentStatus(AgentStatus.CONNECTED);
        if (request.getAgentVersion() != null) {
            host.setAgentVersion(request.getAgentVersion());
        }
        hostRepository.save(host);
    }

    @Transactional(readOnly = true)
    public Host getHostByToken(String token) {
        return hostRepository.findByAuthToken(token).orElse(null);
    }

    @Transactional(readOnly = true)
    public Host getHostById(UUID id) {
        return hostRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Host not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Host> getAllHosts() {
        return hostRepository.findByActiveTrue();
    }

    @Transactional(readOnly = true)
    public Page<Host> getAllHosts(Pageable pageable) {
        return hostRepository.findAll(pageable);
    }

    public void deleteHost(UUID id) {
        if (!hostRepository.existsById(id)) {
            throw new EntityNotFoundException("Host not found: " + id);
        }
        hostRepository.deleteById(id);
    }

    public void checkStaleAgents() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(STALE_THRESHOLD_SECONDS);
        List<Host> hosts = hostRepository.findByActiveTrue();
        for (Host host : hosts) {
            if (host.getLastSeenAt() == null) continue;
            if (host.getLastSeenAt().isBefore(cutoff) && host.getAgentStatus() == AgentStatus.CONNECTED) {
                host.setAgentStatus(AgentStatus.STALE);
                hostRepository.save(host);
                log.info("Host {} marked STALE (last seen: {})", host.getHostname(), host.getLastSeenAt());
            }
        }
    }
}
