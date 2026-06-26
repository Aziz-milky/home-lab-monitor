package com.homelab.monitor.service;

import com.homelab.monitor.model.AgentStatus;
import com.homelab.monitor.model.Alert;
import com.homelab.monitor.model.AlertRule;
import com.homelab.monitor.model.HealthCheck;
import com.homelab.monitor.model.Host;
import com.homelab.monitor.model.HostType;
import com.homelab.monitor.model.Service;
import com.homelab.monitor.model.ServiceDependency;
import com.homelab.monitor.model.ServiceType;
import com.homelab.monitor.model.Severity;
import com.homelab.monitor.repository.AlertRepository;
import com.homelab.monitor.repository.AlertRuleRepository;
import com.homelab.monitor.repository.HealthCheckRepository;
import com.homelab.monitor.repository.HostRepository;
import com.homelab.monitor.repository.ServiceDependencyRepository;
import com.homelab.monitor.repository.ServiceRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class SeedDataService {

    private final HostRepository hostRepository;
    private final ServiceRepository serviceRepository;
    private final HealthCheckRepository healthCheckRepository;
    private final AlertRuleRepository alertRuleRepository;
    private final AlertRepository alertRepository;
    private final ServiceDependencyRepository dependencyRepository;

    @Value("${seed.enabled:false}")
    private boolean seedEnabled;

    private final Random rng = new Random(42);

    @PostConstruct
    void seed() {
        if (!seedEnabled) return;

        // Seed v2 Host entities regardless (runs once — checks host count)
        seedHosts();

        if (serviceRepository.count() > 0) {
            log.info("Service seed skipped — services already exist");
            return;
        }

        var services = List.of(
                createService("Grafana", "192.168.1.10", 3000, ServiceType.GRAFANA, "http://192.168.1.10:3000/"),
                createService("TrueNAS", "192.168.1.20", 443, ServiceType.TRUENAS, "https://192.168.1.20/"),
                createService("Pi-hole", "192.168.1.5", 80, ServiceType.PIHOLE, "http://192.168.1.5/admin/api.php"),
                createService("Ollama", "192.168.1.10", 11434, ServiceType.OLLAMA, "http://192.168.1.10:11434/"),
                createService("Proxmox", "192.168.1.30", 8006, ServiceType.PROXMOX, "https://192.168.1.30:8006/"),
                createService("Portainer", "192.168.1.10", 9443, ServiceType.GENERIC, "https://192.168.1.10:9443/")
        );

        for (var svc : services) seedChecks(svc);

        createAlertRule(services.get(0), "RESPONSE_TIME", 500, null);
        createAlertRule(services.get(4), "RESPONSE_TIME", 2000, null);
        createAlertRule(services.get(3), "FAILURE_COUNT", null, 3);
        createAlertRule(services.get(1), "FAILURE_COUNT", null, 1);

        createAlert(services.get(1), Severity.CRITICAL, "Connection refused — TrueNAS is down");
        createAlert(services.get(3), Severity.WARNING, "Service failed 3 consecutive health checks");

        createDependency(services.get(0), services.get(3), "queries AI models");
        createDependency(services.get(5), services.get(4), "runs on Proxmox");
        createDependency(services.get(2), services.get(1), "resolves DNS for TrueNAS");
        createDependency(services.get(1), services.get(4), "storage backed by Proxmox");

        log.info("Seeded {} services, ~{} health checks, {} alert rules, {} alerts, {} dependencies",
                services.size(), services.size() * 100, 4, 2, 4);
    }

    private void seedHosts() {
        if (hostRepository.count() > 0) {
            log.info("Host seed skipped — hosts already exist");
            return;
        }
        var now = LocalDateTime.now();
        hostRepository.saveAll(List.of(
                Host.builder().name("Gateway").agentId(UUID.randomUUID()).hostname("gateway")
                        .os("Debian 13").arch("x86_64").kernelVersion("6.12.0-amd64")
                        .hostType(HostType.LINUX_SERVER).ipAddress("10.43.145.1")
                        .agentStatus(AgentStatus.CONNECTED).lastSeenAt(now).agentVersion("1.0.0")
                        .active(true).demo(true).createdAt(now).build(),
                Host.builder().name("Node-01").agentId(UUID.randomUUID()).hostname("node-01")
                        .os("Ubuntu 24.04").arch("x86_64").kernelVersion("6.8.0-generic")
                        .hostType(HostType.DOCKER_HOST).ipAddress("10.43.145.10")
                        .agentStatus(AgentStatus.CONNECTED).lastSeenAt(now).agentVersion("1.0.0")
                        .active(true).demo(true).createdAt(now).build(),
                Host.builder().name("Node-02").agentId(UUID.randomUUID()).hostname("node-02")
                        .os("Debian 12").arch("x86_64").kernelVersion("6.1.0-amd64")
                        .hostType(HostType.LINUX_SERVER).ipAddress("10.43.145.11")
                        .agentStatus(AgentStatus.STALE).lastSeenAt(now.minusMinutes(5)).agentVersion("1.0.0")
                        .active(true).demo(true).createdAt(now).build(),
                Host.builder().name("Storage-01").agentId(UUID.randomUUID()).hostname("storage-01")
                        .os("TrueNAS Scale").arch("x86_64").kernelVersion("6.6.0-truenas")
                        .hostType(HostType.TRUENAS).ipAddress("10.43.145.20")
                        .agentStatus(AgentStatus.CONNECTED).lastSeenAt(now).agentVersion("1.0.0")
                        .active(true).demo(true).createdAt(now).build()
        ));
        log.info("Seeded 4 demo hosts (active=true) — shows on dashboard until real agents connect");
    }

    private Service createService(String name, String host, int port, ServiceType type, String url) {
        var s = Service.builder()
                .name(name).host(host).port(port).serviceType(type)
                .checkUrl(url).active(false).createdAt(LocalDateTime.now())
                .build();
        return serviceRepository.save(s);
    }

    private void seedChecks(Service svc) {
        var now = LocalDateTime.now();
        for (int i = 99; i >= 0; i--) {
            var t = now.minusMinutes(i * 30L);
            HealthCheck.HealthCheckBuilder hb = HealthCheck.builder().service(svc).checkedAt(t);

            switch (svc.getServiceType()) {
                case GRAFANA -> grafana(hb);
                case TRUENAS -> truenas(hb);
                case PIHOLE -> pihole(hb);
                case OLLAMA -> ollama(hb, i);
                case PROXMOX -> proxmox(hb, i);
                default -> portainer(hb);
            }

            healthCheckRepository.save(hb.build());
        }
    }

    private void grafana(HealthCheck.HealthCheckBuilder hb) {
        hb.status("UP").responseTimeMs(100 + rng.nextInt(41)).httpStatus(200);
    }

    private void truenas(HealthCheck.HealthCheckBuilder hb) {
        hb.status("DOWN").responseTimeMs(0).httpStatus(0)
                .errorMessage("Connection refused: " + (rng.nextBoolean() ? "No route to host" : "Connection timed out"));
    }

    private void pihole(HealthCheck.HealthCheckBuilder hb) {
        hb.status("UP").responseTimeMs(30 + rng.nextInt(21)).httpStatus(200);
    }

    private void ollama(HealthCheck.HealthCheckBuilder hb, int i) {
        boolean up = (i % 20 < 10) || (i >= 50 && i < 55) || (i >= 80);
        if (up) {
            hb.status("UP").responseTimeMs(200 + rng.nextInt(101)).httpStatus(200);
        } else {
            hb.status("DOWN").responseTimeMs(0).httpStatus(503)
                    .errorMessage("Service unavailable");
        }
    }

    private void proxmox(HealthCheck.HealthCheckBuilder hb, int i) {
        double degradation = 1.0 + (99 - i) * 0.05;
        int rt = (int) (200 * degradation) + rng.nextInt(51);
        hb.status("UP").responseTimeMs(Math.min(rt, 8000)).httpStatus(200);
    }

    private void portainer(HealthCheck.HealthCheckBuilder hb) {
        hb.status("UP").responseTimeMs(70 + rng.nextInt(21)).httpStatus(200);
    }

    private void createAlertRule(Service svc, String type, Integer thresholdMs, Integer failureCount) {
        alertRuleRepository.save(AlertRule.builder()
                .service(svc).ruleType(type).thresholdMs(thresholdMs).failureCount(failureCount).condition(null).enabled(true)
                .build());
    }

    private void createAlert(Service svc, Severity severity, String message) {
        alertRepository.save(Alert.builder()
                .service(svc).severity(severity).message(message)
                .acknowledged(false).triggeredAt(LocalDateTime.now().minusMinutes(15))
                .build());
    }

    private void createDependency(Service source, Service target, String label) {
        dependencyRepository.save(ServiceDependency.builder()
                .sourceService(source).targetService(target).label(label)
                .build());
    }
}
