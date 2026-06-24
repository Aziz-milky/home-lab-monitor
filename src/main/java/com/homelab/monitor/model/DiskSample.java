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
@Table(name = "disk_samples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiskSample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Host host;

    @Column(name = "mount_point", nullable = false)
    private String mountPoint;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Column(name = "total_bytes")
    private long totalBytes;

    @Column(name = "used_bytes")
    private long usedBytes;

    @Column(name = "free_bytes")
    private long freeBytes;

    @Column(name = "usage_percent")
    private double usagePercent;

    @Column(name = "read_bytes_per_sec")
    private long readBytesPerSec;

    @Column(name = "write_bytes_per_sec")
    private long writeBytesPerSec;

    @Column(name = "iops_read")
    private long iopsRead;

    @Column(name = "iops_write")
    private long iopsWrite;
}
