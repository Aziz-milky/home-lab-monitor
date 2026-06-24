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
@Table(name = "container_samples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContainerSample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Host host;

    @Column(name = "container_id")
    private String containerId;

    @Column(name = "container_name", nullable = false)
    private String containerName;

    @Column(name = "image_name")
    private String imageName;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContainerStatus status;

    @Column(name = "cpu_percent")
    private double cpuPercent;

    @Column(name = "memory_used_bytes")
    private long memoryUsedBytes;

    @Column(name = "memory_limit_bytes")
    private long memoryLimitBytes;

    @Column(name = "net_rx_bytes")
    private long netRxBytes;

    @Column(name = "net_tx_bytes")
    private long netTxBytes;

    @Column(name = "block_read_bytes")
    private long blockReadBytes;

    @Column(name = "block_write_bytes")
    private long blockWriteBytes;

    @Column(name = "restart_count")
    private int restartCount;

    @Column(name = "uptime_seconds")
    private long uptimeSeconds;

    @Column(name = "exit_code")
    private Integer exitCode;
}
