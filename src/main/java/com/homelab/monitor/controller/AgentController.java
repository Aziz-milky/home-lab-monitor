package com.homelab.monitor.controller;

import com.homelab.monitor.dto.AgentRegistrationRequest;
import com.homelab.monitor.dto.AgentRegistrationResponse;
import com.homelab.monitor.dto.HeartbeatRequest;
import com.homelab.monitor.model.Host;
import com.homelab.monitor.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @PostMapping("/register")
    public ResponseEntity<AgentRegistrationResponse> register(@RequestBody AgentRegistrationRequest request) {
        AgentRegistrationResponse response = agentService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{hostId}/metrics")
    public ResponseEntity<Void> pushMetrics(
            @PathVariable UUID hostId,
            @RequestBody Map<String, Object> payload,
            @RequestHeader("Authorization") String authHeader) {
        Host host = agentService.getHostById(hostId);
        validateToken(host, authHeader);
        agentService.ingestMetrics(hostId, payload);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{hostId}/heartbeat")
    public ResponseEntity<Void> heartbeat(
            @PathVariable UUID hostId,
            @RequestBody HeartbeatRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Host host = agentService.getHostById(hostId);
        validateToken(host, authHeader);
        agentService.processHeartbeat(hostId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<Host>> listAgents(Pageable pageable) {
        return ResponseEntity.ok(agentService.getAllHosts(pageable));
    }

    @GetMapping("/{hostId}")
    public ResponseEntity<Host> getAgent(@PathVariable UUID hostId) {
        return ResponseEntity.ok(agentService.getHostById(hostId));
    }

    @DeleteMapping("/{hostId}")
    public ResponseEntity<Void> deregister(@PathVariable UUID hostId) {
        agentService.deleteHost(hostId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    private void validateToken(Host host, String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new SecurityException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        if (!token.equals(host.getAuthToken())) {
            throw new SecurityException("Invalid auth token for host: " + host.getId());
        }
    }
}
