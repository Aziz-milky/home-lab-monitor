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
@Table(name = "process_samples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessSample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Host host;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Column(nullable = false)
    private int pid;

    private int ppid;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String command;

    @Column(name = "cpu_percent")
    private double cpuPercent;

    @Column(name = "memory_bytes")
    private long memoryBytes;

    @Column(length = 4)
    private String state;

    private int threads;

    @Column(name = "open_fds")
    private int openFds;
}
