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
@Table(name = "service_endpoints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Host host;

    @Column(nullable = false)
    private String name;

    @Column(name = "check_url")
    private String checkUrl;

    @Column(name = "service_type")
    private String serviceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_status")
    private EndpointStatus lastStatus;

    @Column(name = "last_response_time_ms")
    private int lastResponseTimeMs;

    @Column(name = "last_http_status")
    private int lastHttpStatus;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    @Column(name = "cert_expiry_days")
    private Integer certExpiryDays;
}
