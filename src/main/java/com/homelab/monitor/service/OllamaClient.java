package com.homelab.monitor.service;

import com.homelab.monitor.model.Alert;
import com.homelab.monitor.model.HealthCheck;
import com.homelab.monitor.model.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.List;

@org.springframework.stereotype.Service
public class OllamaClient {

    private static final Logger log = LoggerFactory.getLogger(OllamaClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String model;
    private final boolean enabled;

    public OllamaClient(@Qualifier("ollamaRestTemplate") RestTemplate restTemplate,
                        @Value("${ollama.url:http://localhost:11434}") String baseUrl,
                        @Value("${ollama.model:llama3.2}") String model,
                        @Value("${ollama.enabled:false}") boolean enabled) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
        this.model = model;
        this.enabled = enabled;
    }

    public boolean isAvailable() {
        return enabled;
    }

    public String analyze(Service service, List<HealthCheck> checks, List<Alert> alerts) {
        if (!enabled) {
            return "AI analysis not configured. Set ollama.enabled=true in application.properties.";
        }
        try {
            String prompt = buildPrompt(service, checks, alerts);
            var request = new OllamaRequest(model, prompt, false);
            var response = restTemplate.postForObject(baseUrl + "/api/generate", request, OllamaResponse.class);
            if (response != null) {
                return response.response().trim();
            }
            return "No response from Ollama.";
        } catch (Exception e) {
            log.warn("Ollama analysis failed: {}", e.getMessage());
            throw new RuntimeException("Ollama request failed: " + e.getMessage(), e);
        }
    }

    private String buildPrompt(Service service, List<HealthCheck> checks, List<Alert> alerts) {
        var fmt = DateTimeFormatter.ofPattern("MM-dd HH:mm");
        int checkLimit = Math.min(checks.size(), 10);

        StringBuilder sb = new StringBuilder();
        sb.append("Service: ").append(service.getName()).append(" (").append(service.getServiceType()).append(")\n");
        sb.append("Status: ").append(checks.isEmpty() ? "UNKNOWN" : checks.get(0).getStatus());
        if (!checks.isEmpty()) sb.append(" | ").append(checks.get(0).getResponseTimeMs()).append("ms");
        sb.append("\n\n");

        sb.append("Recent checks (").append(checkLimit).append("):\n");
        checks.stream().limit(10).forEach(c -> {
            sb.append(c.getStatus().charAt(0));
            sb.append(" ").append(c.getCheckedAt().format(fmt));
            if (c.getResponseTimeMs() > 0) sb.append(" ").append(c.getResponseTimeMs()).append("ms");
            sb.append("\n");
        });

        if (!alerts.isEmpty()) {
            sb.append("\nAlerts:\n");
            alerts.forEach(a -> sb.append(a.getSeverity().name().charAt(0)).append(" ").append(a.getMessage()).append("\n"));
        }

        sb.append("\nDescribe this service's health in 1-2 short sentences. Mention any issues and one fix.");
        return sb.toString();
    }

    private record OllamaRequest(String model, String prompt, boolean stream) {}
    private record OllamaResponse(String response) {}
}
