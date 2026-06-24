package com.homelab.monitor.controller;

import com.homelab.monitor.model.AgentStatus;
import com.homelab.monitor.model.ContainerSample;
import com.homelab.monitor.model.ContainerStatus;
import com.homelab.monitor.model.Host;
import com.homelab.monitor.model.MetricSnapshot;
import com.homelab.monitor.model.ServiceDependency;
import com.homelab.monitor.repository.AlertRepository;
import com.homelab.monitor.repository.ContainerSampleRepository;
import com.homelab.monitor.repository.HostRepository;
import com.homelab.monitor.repository.MetricSnapshotRepository;
import com.homelab.monitor.repository.ServiceDependencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fleet")
@RequiredArgsConstructor
public class FleetController {

    private final HostRepository hostRepository;
    private final AlertRepository alertRepository;
    private final ContainerSampleRepository containerSampleRepository;
    private final MetricSnapshotRepository metricSnapshotRepository;
    private final ServiceDependencyRepository serviceDependencyRepository;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        List<Host> hosts = hostRepository.findByActiveTrue();

        long online = hosts.stream().filter(h -> h.getAgentStatus() == AgentStatus.CONNECTED).count();
        long offline = hosts.stream().filter(h -> h.getAgentStatus() != AgentStatus.CONNECTED).count();
        long stale = hosts.stream().filter(h -> h.getAgentStatus() == AgentStatus.STALE).count();
        long neverSeen = hosts.stream().filter(h -> h.getAgentStatus() == AgentStatus.NEVER_SEEN).count();

        List<ContainerSample> recentContainers = containerSampleRepository
                .findByCollectedAtBetweenOrderByCollectedAtAsc(
                        LocalDateTime.now().minusMinutes(5), LocalDateTime.now(),
                        PageRequest.of(0, 200)).getContent();
        long containersRunning = recentContainers.stream()
                .filter(c -> c.getStatus() == ContainerStatus.RUNNING).count();
        long containersStopped = recentContainers.stream()
                .filter(c -> c.getStatus() == ContainerStatus.STOPPED).count();
        long containersRestarting = recentContainers.stream()
                .filter(c -> c.getStatus() == ContainerStatus.RESTARTING).count();

        long activeAlerts = alertRepository.findByAcknowledgedOrderByTriggeredAtDesc(false).size();

        Map<String, Object> overview = new HashMap<>();
        overview.put("totalHosts", hosts.size());
        overview.put("hostsOnline", online);
        overview.put("hostsOffline", offline);
        overview.put("hostsStale", stale);
        overview.put("hostsNeverSeen", neverSeen);
        overview.put("containersRunning", containersRunning);
        overview.put("containersStopped", containersStopped);
        overview.put("containersRestarting", containersRestarting);
        overview.put("activeAlerts", activeAlerts);

        double coverage = hosts.isEmpty() ? 0 : (double) online / hosts.size() * 100;
        overview.put("agentCoveragePercent", Math.round(coverage * 10.0) / 10.0);

        return ResponseEntity.ok(overview);
    }

    @GetMapping("/containers")
    public ResponseEntity<List<ContainerSample>> getFleetContainers() {
        List<Host> hosts = hostRepository.findByActiveTrue();
        return ResponseEntity.ok(
                containerSampleRepository.findByCollectedAtBetweenOrderByCollectedAtAsc(
                        LocalDateTime.now().minusMinutes(5), LocalDateTime.now(),
                        PageRequest.of(0, 500)).getContent());
    }

    @GetMapping("/topology")
    public ResponseEntity<Map<String, Object>> getTopology() {
        List<Host> hosts = hostRepository.findByActiveTrue();
        List<ServiceDependency> dependencies = serviceDependencyRepository.findAll();

        Map<String, Object> topology = new HashMap<>();
        topology.put("hosts", hosts);
        topology.put("dependencies", dependencies);
        return ResponseEntity.ok(topology);
    }
}
