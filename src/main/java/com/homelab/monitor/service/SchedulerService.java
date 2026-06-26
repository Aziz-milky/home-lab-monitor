package com.homelab.monitor.service;

import com.homelab.monitor.model.Alert;
import com.homelab.monitor.model.AlertRule;
import com.homelab.monitor.model.HealthCheck;
import com.homelab.monitor.model.Service;
import com.homelab.monitor.model.Severity;
import com.homelab.monitor.repository.AlertRepository;
import com.homelab.monitor.repository.AlertRuleRepository;
import com.homelab.monitor.repository.HealthCheckRepository;
import com.homelab.monitor.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@org.springframework.stereotype.Service
public class SchedulerService {

    private final ServiceRepository serviceRepository;
    private final HealthCheckRepository healthCheckRepository;
    private final AlertRuleRepository alertRuleRepository;
    private final AlertRepository alertRepository;
    private final RestTemplate restTemplate;
    private final AlertRuleEvaluatorService alertRuleEvaluatorService;
    private final DataRetentionService dataRetentionService;

    @Scheduled(fixedDelay = 30000)
    public void performHealthChecks() {
        for (Service service : serviceRepository.findAll()) {
            if (!service.isActive()) {
                continue;
            }
            HealthCheck check = HealthCheck.builder()
                    .service(service)
                    .checkedAt(LocalDateTime.now())
                    .build();
            try {
                long start = System.currentTimeMillis();
                org.springframework.http.ResponseEntity<String> response = restTemplate.getForEntity(
                        service.getCheckUrl(), String.class);
                long elapsed = System.currentTimeMillis() - start;

                check.setStatus("UP");
                check.setResponseTimeMs((int) elapsed);
                check.setHttpStatus(response.getStatusCode().value());
            } catch (HttpStatusCodeException e) {
                check.setStatus("DOWN");
                check.setResponseTimeMs(0);
                check.setHttpStatus(e.getStatusCode().value());
                check.setErrorMessage(e.getStatusText());
            } catch (ResourceAccessException e) {
                check.setStatus("DOWN");
                check.setResponseTimeMs(0);
                check.setHttpStatus(0);
                check.setErrorMessage("Connection failed: " + e.getMessage());
            } catch (Exception e) {
                check.setStatus("DOWN");
                check.setResponseTimeMs(0);
                check.setHttpStatus(0);
                check.setErrorMessage(e.getMessage());
            }
            healthCheckRepository.save(check);
            evaluateRules(service, check);
        }
        alertRuleEvaluatorService.evaluateRules();
    }

    @Scheduled(cron = "0 0 * * * *")
    public void purgeOldData() {
        dataRetentionService.purgeOldData();
    }

    private void evaluateRules(Service service, HealthCheck check) {
        List<AlertRule> rules = alertRuleRepository.findByServiceIdAndEnabledTrue(service.getId());
        for (AlertRule rule : rules) {
            switch (rule.getRuleType()) {
                case "RESPONSE_TIME":
                    evaluateResponseTimeRule(service, rule, check);
                    break;
                case "FAILURE_COUNT":
                    evaluateFailureCountRule(service, rule);
                    break;
            }
        }
    }

    private void evaluateResponseTimeRule(Service service, AlertRule rule, HealthCheck check) {
        if (rule.getThresholdMs() == null || check.getResponseTimeMs() <= rule.getThresholdMs()) {
            return;
        }
        String messagePrefix = "Response time";
        if (alertRepository.findFirstByServiceAndAcknowledgedAndMessageStartingWith(
                service, false, messagePrefix).isPresent()) {
            return;
        }
        Severity severity = check.getResponseTimeMs() > rule.getThresholdMs() * 2
                ? Severity.CRITICAL : Severity.WARNING;
        Alert alert = Alert.builder()
                .service(service)
                .severity(severity)
                .message(messagePrefix + " " + check.getResponseTimeMs() + "ms exceeds threshold "
                        + rule.getThresholdMs() + "ms")
                .acknowledged(false)
                .triggeredAt(LocalDateTime.now())
                .build();
        alertRepository.save(alert);
    }

    private void evaluateFailureCountRule(Service service, AlertRule rule) {
        if (rule.getFailureCount() == null || rule.getFailureCount() <= 0) {
            return;
        }
        List<HealthCheck> recent = healthCheckRepository
                .findByServiceIdOrderByCheckedAtDesc(service.getId(), PageRequest.of(0, rule.getFailureCount()))
                .getContent();

        if (recent.size() < rule.getFailureCount()) {
            return;
        }

        long consecutiveFailures = 0;
        for (HealthCheck hc : recent) {
            if ("DOWN".equals(hc.getStatus())) {
                consecutiveFailures++;
            } else {
                break;
            }
        }

        if (consecutiveFailures >= rule.getFailureCount()) {
            String message = "Service failed " + consecutiveFailures + " consecutive health checks";
            if (alertRepository.findFirstByServiceAndAcknowledgedAndMessageStartingWith(
                    service, false, "Service failed").isPresent()) {
                return;
            }
            Alert alert = Alert.builder()
                    .service(service)
                    .severity(Severity.CRITICAL)
                    .message(message)
                    .acknowledged(false)
                    .triggeredAt(LocalDateTime.now())
                    .build();
            alertRepository.save(alert);
        }
    }
}
