package com.homelab.monitor.service;

import com.homelab.monitor.model.Alert;
import com.homelab.monitor.model.HealthCheck;
import com.homelab.monitor.model.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class OllamaClient {

    private static final Logger log = LoggerFactory.getLogger(OllamaClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String model;
    private final boolean enabled;

    public OllamaClient(RestTemplate restTemplate,
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
        StringBuilder sb = new StringBuilder();
        sb.append("You are a homelab monitoring diagnostic assistant. Analyze the following service health data and provide a brief, actionable insight.\n\n");
        sb.append("Service: ").append(service.getName()).append("\n");
        sb.append("Type: ").append(service.getServiceType()).append("\n");
        sb.append("URL: ").append(service.getCheckUrl()).append("\n\n");

        sb.append("Recent Health Checks (last ").append(Math.min(checks.size(), 30)).append("):\n");
        checks.stream().limit(30).forEach(c ->
                sb.append("  [").append(c.getCheckedAt()).append("] ")
                        .append(c.getStatus())
                        .append(" | ").append(c.getResponseTimeMs()).append("ms")
                        .append(" | HTTP ").append(c.getHttpStatus())
                        .append(c.getErrorMessage() != null ? " | " + c.getErrorMessage() : "")
                        .append("\n")
        );

        if (!alerts.isEmpty()) {
            sb.append("\nActive Alerts:\n");
            alerts.forEach(a -> sb.append("  [").append(a.getSeverity()).append("] ").append(a.getMessage()).append("\n"));
        }

        sb.append("\nProvide a concise analysis (2-3 sentences) covering: current state, any patterns or concerns, and a specific recommendation.");
        return sb.toString();
    }

    private record OllamaRequest(String model, String prompt, boolean stream) {}
    private record OllamaResponse(String response) {}
}
