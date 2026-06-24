package com.homelab.monitor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "network_samples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NetworkSample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Host host;

    @Column(name = "interface_name", nullable = false)
    private String interfaceName;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Column(name = "rx_bytes_per_sec")
    private long rxBytesPerSec;

    @Column(name = "tx_bytes_per_sec")
    private long txBytesPerSec;

    @Column(name = "rx_packets_per_sec")
    private long rxPacketsPerSec;

    @Column(name = "tx_packets_per_sec")
    private long txPacketsPerSec;

    @Column(name = "rx_errors")
    private long rxErrors;

    @Column(name = "tx_errors")
    private long txErrors;

    @Column(name = "rx_drops")
    private long rxDrops;

    @Column(name = "tx_drops")
    private long txDrops;
}
