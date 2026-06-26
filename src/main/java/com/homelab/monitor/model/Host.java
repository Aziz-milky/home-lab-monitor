package com.homelab.monitor.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "hosts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Host {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "agent_id", nullable = false, unique = true)
    private UUID agentId;

    @Column(name = "agent_version")
    private String agentVersion;

    @Column(nullable = false)
    private String hostname;

    private String os;

    private String arch;

    @Column(name = "kernel_version")
    private String kernelVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "host_type", nullable = false)
    private HostType hostType;

    @Column(name = "ip_address")
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_status", nullable = false)
    @Builder.Default
    private AgentStatus agentStatus = AgentStatus.NEVER_SEEN;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "agent_interval_seconds")
    @Builder.Default
    private Integer agentIntervalSeconds = 30;

    @ElementCollection
    @CollectionTable(name = "host_tags", joinColumns = @JoinColumn(name = "host_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(name = "auth_token", unique = true)
    private String authToken;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "is_demo")
    @Builder.Default
    private Boolean demo = false;

}
