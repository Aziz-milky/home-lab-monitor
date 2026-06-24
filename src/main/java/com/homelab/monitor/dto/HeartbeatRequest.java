package com.homelab.monitor.dto;

import com.homelab.monitor.model.AgentHeartbeat.HeartbeatStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeartbeatRequest {
    private String agentVersion;
    private HeartbeatStatus status;
    private int pendingBufferSize;
}
