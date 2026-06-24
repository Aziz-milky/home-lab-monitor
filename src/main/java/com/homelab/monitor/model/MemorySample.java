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
@Table(name = "memory_samples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemorySample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Host host;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Column(name = "total_bytes")
    private long totalBytes;

    @Column(name = "used_bytes")
    private long usedBytes;

    @Column(name = "free_bytes")
    private long freeBytes;

    @Column(name = "cached_bytes")
    private long cachedBytes;

    @Column(name = "swap_total")
    private long swapTotal;

    @Column(name = "swap_used")
    private long swapUsed;
}
