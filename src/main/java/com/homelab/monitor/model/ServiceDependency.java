package com.homelab.monitor.model;

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

import java.util.UUID;

@Entity
@Table(name = "service_dependencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "source_service_id", nullable = false)
    private Service sourceService;

    @ManyToOne
    @JoinColumn(name = "target_service_id", nullable = false)
    private Service targetService;

    private String label;
}
