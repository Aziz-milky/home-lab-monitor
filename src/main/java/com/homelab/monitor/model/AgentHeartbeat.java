package com.homelab.monitor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agent_heartbeats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentHeartbeat {

    public enum HeartbeatStatus {
        OK,
        DEGRADED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Host host;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;

    @Column(name = "agent_version")
    private String agentVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HeartbeatStatus status = HeartbeatStatus.OK;

    @Column(name = "pending_buffer_size")
    @Builder.Default
    private int pendingBufferSize = 0;
}
