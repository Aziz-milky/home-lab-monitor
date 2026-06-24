package com.homelab.monitor.service;

import com.homelab.monitor.model.ContainerSample;
import com.homelab.monitor.model.ContainerStatus;
import com.homelab.monitor.model.CpuSample;
import com.homelab.monitor.model.DiskSample;
import com.homelab.monitor.model.EndpointStatus;
import com.homelab.monitor.model.Host;
import com.homelab.monitor.model.MemorySample;
import com.homelab.monitor.model.NetworkSample;
import com.homelab.monitor.model.ProcessSample;
import com.homelab.monitor.model.ServiceEndpoint;
import com.homelab.monitor.repository.ContainerSampleRepository;
import com.homelab.monitor.repository.CpuSampleRepository;
import com.homelab.monitor.repository.DiskSampleRepository;
import com.homelab.monitor.repository.MemorySampleRepository;
import com.homelab.monitor.repository.NetworkSampleRepository;
import com.homelab.monitor.repository.ProcessSampleRepository;
import com.homelab.monitor.repository.ServiceEndpointRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MetricExtractorService {

    private static final Logger log = LoggerFactory.getLogger(MetricExtractorService.class);

    private final CpuSampleRepository cpuSampleRepository;
    private final MemorySampleRepository memorySampleRepository;
    private final DiskSampleRepository diskSampleRepository;
    private final NetworkSampleRepository networkSampleRepository;
    private final ContainerSampleRepository containerSampleRepository;
    private final ProcessSampleRepository processSampleRepository;
    private final ServiceEndpointRepository serviceEndpointRepository;

    @SuppressWarnings("unchecked")
    public void extract(Host host, LocalDateTime collectedAt, Map<String, Object> payload) {
        Map<String, Object> metrics = (Map<String, Object>) payload.get("metrics");
        if (metrics == null) return;

        try { extractCpu(host, collectedAt, metrics); } catch (Exception e) {
            log.warn("Failed to extract CPU samples for host {}: {}", host.getId(), e.getMessage());
        }
        try { extractMemory(host, collectedAt, metrics); } catch (Exception e) {
            log.warn("Failed to extract memory samples: {}", e.getMessage());
        }
        try { extractDisks(host, collectedAt, metrics); } catch (Exception e) {
            log.warn("Failed to extract disk samples: {}", e.getMessage());
        }
        try { extractNetwork(host, collectedAt, metrics); } catch (Exception e) {
            log.warn("Failed to extract network samples: {}", e.getMessage());
        }
        try { extractContainers(host, collectedAt, payload); } catch (Exception e) {
            log.warn("Failed to extract container samples: {}", e.getMessage());
        }
        try { extractProcesses(host, collectedAt, metrics); } catch (Exception e) {
            log.warn("Failed to extract process samples: {}", e.getMessage());
        }
        try { extractServiceEndpoints(host, collectedAt, payload); } catch (Exception e) {
            log.warn("Failed to extract service endpoints: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void extractCpu(Host host, LocalDateTime collectedAt, Map<String, Object> metrics) {
        Map<String, Object> cpu = (Map<String, Object>) metrics.get("cpu");
        if (cpu == null) return;

        CpuSample sample = CpuSample.builder()
                .host(host)
                .collectedAt(collectedAt)
                .usagePercent(doubleVal(cpu.get("usagePercent")))
                .coreCount(intVal(cpu.get("coreCount")))
                .loadAvg1(doubleVal(cpu.get("loadAvg1")))
                .loadAvg5(doubleVal(cpu.get("loadAvg5")))
                .loadAvg15(doubleVal(cpu.get("loadAvg15")))
                .build();

        Object coreUsages = cpu.get("coreUsages");
        if (coreUsages instanceof List<?> list) {
            sample.setCoreUsages(list.toString());
        }

        cpuSampleRepository.save(sample);
    }

    @SuppressWarnings("unchecked")
    private void extractMemory(Host host, LocalDateTime collectedAt, Map<String, Object> metrics) {
        Map<String, Object> mem = (Map<String, Object>) metrics.get("memory");
        if (mem == null) return;

        MemorySample sample = MemorySample.builder()
                .host(host)
                .collectedAt(collectedAt)
                .totalBytes(longVal(mem.get("totalBytes")))
                .usedBytes(longVal(mem.get("usedBytes")))
                .freeBytes(longVal(mem.get("freeBytes")))
                .cachedBytes(longVal(mem.get("cachedBytes")))
                .swapTotal(longVal(mem.get("swapTotal")))
                .swapUsed(longVal(mem.get("swapUsed")))
                .build();

        memorySampleRepository.save(sample);
    }

    @SuppressWarnings("unchecked")
    private void extractDisks(Host host, LocalDateTime collectedAt, Map<String, Object> metrics) {
        Object disksObj = metrics.get("disks");
        if (!(disksObj instanceof List<?> disks)) return;

        for (Object diskObj : disks) {
            if (!(diskObj instanceof Map<?, ?> diskMap)) continue;
            Map<String, Object> disk = (Map<String, Object>) diskMap;

            DiskSample sample = DiskSample.builder()
                    .host(host)
                    .mountPoint(stringVal(disk.get("mountPoint")))
                    .collectedAt(collectedAt)
                    .totalBytes(longVal(disk.get("totalBytes")))
                    .usedBytes(longVal(disk.get("usedBytes")))
                    .freeBytes(longVal(disk.get("freeBytes")))
                    .usagePercent(doubleVal(disk.get("usagePercent")))
                    .readBytesPerSec(longVal(disk.get("readBytesPerSec")))
                    .writeBytesPerSec(longVal(disk.get("writeBytesPerSec")))
                    .iopsRead(longVal(disk.get("iopsRead")))
                    .iopsWrite(longVal(disk.get("iopsWrite")))
                    .build();

            diskSampleRepository.save(sample);
        }
    }

    @SuppressWarnings("unchecked")
    private void extractNetwork(Host host, LocalDateTime collectedAt, Map<String, Object> metrics) {
        Map<String, Object> net = (Map<String, Object>) metrics.get("network");
        if (net == null) return;

        Object ifacesObj = net.get("interfaces");
        if (!(ifacesObj instanceof List<?> ifaces)) return;

        for (Object ifaceObj : ifaces) {
            if (!(ifaceObj instanceof Map<?, ?> ifaceMap)) continue;
            Map<String, Object> iface = (Map<String, Object>) ifaceMap;

            NetworkSample sample = NetworkSample.builder()
                    .host(host)
                    .interfaceName(stringVal(iface.get("interfaceName")))
                    .collectedAt(collectedAt)
                    .rxBytesPerSec(longVal(iface.get("rxBytesPerSec")))
                    .txBytesPerSec(longVal(iface.get("txBytesPerSec")))
                    .rxPacketsPerSec(longVal(iface.get("rxPacketsPerSec")))
                    .txPacketsPerSec(longVal(iface.get("txPacketsPerSec")))
                    .rxErrors(longVal(iface.get("rxErrors")))
                    .txErrors(longVal(iface.get("txErrors")))
                    .rxDrops(longVal(iface.get("rxDrops")))
                    .txDrops(longVal(iface.get("txDrops")))
                    .build();

            networkSampleRepository.save(sample);
        }
    }

    @SuppressWarnings("unchecked")
    private void extractContainers(Host host, LocalDateTime collectedAt, Map<String, Object> payload) {
        Object containersObj = payload.get("containers");
        if (!(containersObj instanceof List<?> containers)) return;

        for (Object containerObj : containers) {
            if (!(containerObj instanceof Map<?, ?> containerMap)) continue;
            Map<String, Object> c = (Map<String, Object>) containerMap;

            ContainerSample sample = ContainerSample.builder()
                    .host(host)
                    .containerId(stringVal(c.get("containerId")))
                    .containerName(stringVal(c.get("containerName")))
                    .imageName(stringVal(c.get("imageName")))
                    .collectedAt(collectedAt)
                    .status(parseContainerStatus(stringVal(c.get("status"))))
                    .cpuPercent(doubleVal(c.get("cpuPercent")))
                    .memoryUsedBytes(longVal(c.get("memoryUsedBytes")))
                    .memoryLimitBytes(longVal(c.get("memoryLimitBytes")))
                    .netRxBytes(longVal(c.get("netRxBytes")))
                    .netTxBytes(longVal(c.get("netTxBytes")))
                    .blockReadBytes(longVal(c.get("blockReadBytes")))
                    .blockWriteBytes(longVal(c.get("blockWriteBytes")))
                    .restartCount(intVal(c.get("restartCount")))
                    .uptimeSeconds(longVal(c.get("uptimeSeconds")))
                    .exitCode(intVal(c.get("exitCode")))
                    .build();

            containerSampleRepository.save(sample);
        }
    }

    @SuppressWarnings("unchecked")
    private void extractProcesses(Host host, LocalDateTime collectedAt, Map<String, Object> metrics) {
        Object procsObj = metrics.get("processes");
        if (!(procsObj instanceof List<?> processes)) return;

        int count = 0;
        for (Object procObj : processes) {
            if (!(procObj instanceof Map<?, ?> procMap)) continue;
            if (count >= 10) break;
            Map<String, Object> p = (Map<String, Object>) procMap;

            ProcessSample sample = ProcessSample.builder()
                    .host(host)
                    .collectedAt(collectedAt)
                    .pid(intVal(p.get("pid")))
                    .ppid(intVal(p.get("ppid")))
                    .name(stringVal(p.get("name")))
                    .command(stringVal(p.get("command")))
                    .cpuPercent(doubleVal(p.get("cpuPercent")))
                    .memoryBytes(longVal(p.get("memoryBytes")))
                    .state(stringVal(p.get("state")))
                    .threads(intVal(p.get("threads")))
                    .openFds(intVal(p.get("openFds")))
                    .build();

            processSampleRepository.save(sample);
            count++;
        }
    }

    @SuppressWarnings("unchecked")
    private void extractServiceEndpoints(Host host, LocalDateTime collectedAt, Map<String, Object> payload) {
        Object servicesObj = payload.get("services");
        if (!(servicesObj instanceof List<?> services)) return;

        for (Object svcObj : services) {
            if (!(svcObj instanceof Map<?, ?> svcMap)) continue;
            Map<String, Object> s = (Map<String, Object>) svcMap;

            ServiceEndpoint endpoint = ServiceEndpoint.builder()
                    .host(host)
                    .name(stringVal(s.get("name")))
                    .checkUrl(stringVal(s.get("checkUrl")))
                    .serviceType(stringVal(s.get("serviceType")))
                    .lastStatus(parseEndpointStatus(stringVal(s.get("lastStatus"))))
                    .lastResponseTimeMs(intVal(s.get("lastResponseTimeMs")))
                    .lastHttpStatus(intVal(s.get("lastHttpStatus")))
                    .lastCheckedAt(collectedAt)
                    .certExpiryDays(intVal(s.get("certExpiryDays")))
                    .build();

            serviceEndpointRepository.save(endpoint);
        }
    }

    private static ContainerStatus parseContainerStatus(String status) {
        if (status == null) return ContainerStatus.UNKNOWN;
        try { return ContainerStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException e) { return ContainerStatus.UNKNOWN; }
    }

    private static EndpointStatus parseEndpointStatus(String status) {
        if (status == null) return EndpointStatus.UNKNOWN;
        try { return EndpointStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException e) { return EndpointStatus.UNKNOWN; }
    }

    private static double doubleVal(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        if (val instanceof String s) try { return Double.parseDouble(s); } catch (NumberFormatException e) { return 0; }
        return 0;
    }

    private static long longVal(Object val) {
        if (val instanceof Number n) return n.longValue();
        if (val instanceof String s) try { return Long.parseLong(s); } catch (NumberFormatException e) { return 0; }
        return 0;
    }

    private static int intVal(Object val) {
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) try { return Integer.parseInt(s); } catch (NumberFormatException e) { return 0; }
        return 0;
    }

    private static String stringVal(Object val) {
        if (val instanceof String s) return s;
        if (val != null) return val.toString();
        return null;
    }
}
