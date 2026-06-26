package com.homelab.monitor.controller;

import com.homelab.monitor.model.ContainerSample;
import com.homelab.monitor.model.CpuSample;
import com.homelab.monitor.model.DiskSample;
import com.homelab.monitor.model.Host;
import com.homelab.monitor.model.LogEvent;
import com.homelab.monitor.model.LogLevel;
import com.homelab.monitor.model.MemorySample;
import com.homelab.monitor.model.NetworkSample;
import com.homelab.monitor.model.ProcessSample;
import com.homelab.monitor.model.ServiceEndpoint;
import com.homelab.monitor.repository.ContainerSampleRepository;
import com.homelab.monitor.repository.CpuSampleRepository;
import com.homelab.monitor.repository.DiskSampleRepository;
import com.homelab.monitor.repository.HostRepository;
import com.homelab.monitor.repository.LogEventRepository;
import com.homelab.monitor.repository.MemorySampleRepository;
import com.homelab.monitor.repository.NetworkSampleRepository;
import com.homelab.monitor.repository.ProcessSampleRepository;
import com.homelab.monitor.repository.ServiceEndpointRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/hosts")
@RequiredArgsConstructor
public class HostController {

    private final HostRepository hostRepository;
    private final CpuSampleRepository cpuSampleRepository;
    private final MemorySampleRepository memorySampleRepository;
    private final DiskSampleRepository diskSampleRepository;
    private final NetworkSampleRepository networkSampleRepository;
    private final ContainerSampleRepository containerSampleRepository;
    private final ProcessSampleRepository processSampleRepository;
    private final ServiceEndpointRepository serviceEndpointRepository;
    private final LogEventRepository logEventRepository;

    private Host findHost(UUID id) {
        return hostRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Host not found: " + id));
    }

    @GetMapping
    public ResponseEntity<Page<Host>> listHosts(Pageable pageable) {
        return ResponseEntity.ok(hostRepository.findAll(pageable));
    }

    @GetMapping("/{hostId}")
    public ResponseEntity<Host> getHost(@PathVariable UUID hostId) {
        return ResponseEntity.ok(findHost(hostId));
    }

    @GetMapping("/{hostId}/cpu")
    public ResponseEntity<Page<CpuSample>> getCpu(
            @PathVariable UUID hostId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            Pageable pageable) {
        findHost(hostId);
        if (from != null && to != null) {
            return ResponseEntity.ok(
                    cpuSampleRepository.findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
                            hostId, from, to, pageable));
        }
        return ResponseEntity.ok(
                cpuSampleRepository.findByHostIdOrderByCollectedAtDesc(hostId, pageable));
    }

    @GetMapping("/{hostId}/memory")
    public ResponseEntity<Page<MemorySample>> getMemory(
            @PathVariable UUID hostId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            Pageable pageable) {
        findHost(hostId);
        if (from != null && to != null) {
            return ResponseEntity.ok(
                    memorySampleRepository.findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
                            hostId, from, to, pageable));
        }
        return ResponseEntity.ok(
                memorySampleRepository.findByHostIdOrderByCollectedAtDesc(hostId, pageable));
    }

    @GetMapping("/{hostId}/disks")
    public ResponseEntity<List<DiskSample>> getDisks(
            @PathVariable UUID hostId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {
        findHost(hostId);
        if (from != null && to != null) {
            return ResponseEntity.ok(
                    diskSampleRepository.findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
                            hostId, from, to, PageRequest.of(0, 500)).getContent());
        }
        return ResponseEntity.ok(
                diskSampleRepository.findTop5ByHostIdOrderByCollectedAtDesc(hostId));
    }

    @GetMapping("/{hostId}/network")
    public ResponseEntity<Page<NetworkSample>> getNetwork(
            @PathVariable UUID hostId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            Pageable pageable) {
        findHost(hostId);
        if (from != null && to != null) {
            return ResponseEntity.ok(
                    networkSampleRepository.findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
                            hostId, from, to, pageable));
        }
        return ResponseEntity.ok(
                networkSampleRepository.findByHostIdOrderByCollectedAtDesc(hostId, pageable));
    }

    @GetMapping("/{hostId}/containers")
    public ResponseEntity<Page<ContainerSample>> getContainers(
            @PathVariable UUID hostId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            Pageable pageable) {
        findHost(hostId);
        if (from != null && to != null) {
            return ResponseEntity.ok(
                    containerSampleRepository.findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
                            hostId, from, to, pageable));
        }
        return ResponseEntity.ok(
                containerSampleRepository.findByHostIdOrderByCollectedAtDesc(hostId, pageable));
    }

    @GetMapping("/{hostId}/containers/{name}")
    public ResponseEntity<Page<ContainerSample>> getContainerHistory(
            @PathVariable UUID hostId,
            @PathVariable String name,
            Pageable pageable) {
        findHost(hostId);
        return ResponseEntity.ok(
                containerSampleRepository.findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
                        hostId, LocalDateTime.now().minusHours(1), LocalDateTime.now(),
                        PageRequest.of(0, 50, Sort.by(Sort.Direction.ASC, "collectedAt"))));
    }

    @GetMapping("/{hostId}/processes")
    public ResponseEntity<List<ProcessSample>> getProcesses(@PathVariable UUID hostId) {
        findHost(hostId);
        return ResponseEntity.ok(
                processSampleRepository.findTop10ByHostIdOrderByCpuPercentDesc(hostId));
    }

    @GetMapping("/{hostId}/endpoints")
    public ResponseEntity<List<ServiceEndpoint>> getEndpoints(@PathVariable UUID hostId) {
        findHost(hostId);
        return ResponseEntity.ok(serviceEndpointRepository.findByHostId(hostId));
    }

    @GetMapping("/{hostId}/logs")
    public ResponseEntity<Page<LogEvent>> getLogs(
            @PathVariable UUID hostId,
            @RequestParam(required = false) LogLevel level,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            Pageable pageable) {
        findHost(hostId);

        LocalDateTime fromTime = from != null ? from : LocalDateTime.now().minusHours(1);
        LocalDateTime toTime = to != null ? to : LocalDateTime.now();

        if (level != null && source != null) {
            return ResponseEntity.ok(
                    logEventRepository.findByHostIdAndLevelAndTimestampBetweenOrderByTimestampDesc(
                            hostId, level, fromTime, toTime, pageable));
        }
        if (level != null) {
            return ResponseEntity.ok(
                    logEventRepository.findByHostIdAndLevelOrderByTimestampDesc(
                            hostId, level, pageable));
        }
        if (source != null) {
            return ResponseEntity.ok(
                    logEventRepository.findByHostIdAndSourceContainingIgnoreCaseOrderByTimestampDesc(
                            hostId, source, pageable));
        }
        return ResponseEntity.ok(
                logEventRepository.findByHostIdAndTimestampBetweenOrderByTimestampDesc(
                        hostId, fromTime, toTime, pageable));
    }

    @GetMapping("/{hostId}/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable UUID hostId) {
        Host host = findHost(hostId);
        Map<String, Object> summary = new HashMap<>();
        summary.put("host", host);

        cpuSampleRepository.findFirstByHostIdOrderByCollectedAtDesc(hostId)
                .ifPresent(c -> summary.put("latestCpu", c));
        memorySampleRepository.findFirstByHostIdOrderByCollectedAtDesc(hostId)
                .ifPresent(m -> summary.put("latestMemory", m));
        summary.put("latestDisks", diskSampleRepository.findTop5ByHostIdOrderByCollectedAtDesc(hostId));
        summary.put("endpoints", serviceEndpointRepository.findByHostId(hostId));
        summary.put("topProcesses", processSampleRepository.findTop10ByHostIdOrderByCpuPercentDesc(hostId));
        summary.put("activeContainers",
                containerSampleRepository.findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
                        hostId, LocalDateTime.now().minusMinutes(5), LocalDateTime.now(),
                        PageRequest.of(0, 50)).getContent());

        return ResponseEntity.ok(summary);
    }
}
