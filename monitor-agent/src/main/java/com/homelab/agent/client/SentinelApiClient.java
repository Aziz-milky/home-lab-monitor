package com.homelab.agent.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.homelab.agent.model.AgentRegistrationResponse;

@Component
public class SentinelApiClient {

    private static final Logger log = LoggerFactory.getLogger(SentinelApiClient.class);

    private final RestTemplate restTemplate;
    private String serverUrl;

    public SentinelApiClient() {
        this.restTemplate = new RestTemplate();
    }

    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl.replaceAll("/+$", "");
    }

    public AgentRegistrationResponse register(Map<String, Object> registrationPayload) {
        String url = serverUrl + "/agents/register";
        log.info("Registering with server at {}", url);
        try {
            AgentRegistrationResponse resp = restTemplate.postForObject(url, registrationPayload, AgentRegistrationResponse.class);
            log.info("Registration successful: hostId={}, agentId={}", resp.getHostId(), resp.getAgentId());
            return resp;
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage());
            throw e;
        }
    }

    public boolean pushMetrics(String hostId, String token, Object payload) {
        String url = serverUrl + "/agents/" + hostId + "/metrics";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);
            HttpEntity<Object> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            if (resp.getStatusCode().is2xxSuccessful()) {
                log.debug("Metrics pushed successfully");
                return true;
            }
            log.warn("Metrics push returned {}", resp.getStatusCode());
            return false;
        } catch (Exception e) {
            log.warn("Metrics push failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean sendHeartbeat(String hostId, String token, Map<String, Object> heartbeatPayload) {
        String url = serverUrl + "/agents/" + hostId + "/heartbeat";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(heartbeatPayload, headers);

            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Heartbeat failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean deregister(String hostId, String token) {
        String url = serverUrl + "/agents/" + hostId;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);
            log.info("Deregistration returned {}", resp.getStatusCode());
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Deregistration failed: {}", e.getMessage());
            return false;
        }
    }
}
