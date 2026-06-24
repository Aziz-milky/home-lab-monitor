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
@Table(name = "cpu_samples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CpuSample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Host host;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Column(name = "usage_percent")
    private double usagePercent;

    @Column(name = "core_count")
    private int coreCount;

    @Column(name = "core_usages", columnDefinition = "TEXT")
    private String coreUsages;

    @Column(name = "load_avg_1")
    private double loadAvg1;

    @Column(name = "load_avg_5")
    private double loadAvg5;

    @Column(name = "load_avg_15")
    private double loadAvg15;
}
