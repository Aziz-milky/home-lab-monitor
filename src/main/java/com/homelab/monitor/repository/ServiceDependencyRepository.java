package com.homelab.monitor.repository;

import com.homelab.monitor.model.ServiceDependency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceDependencyRepository extends JpaRepository<ServiceDependency, UUID> {
    List<ServiceDependency> findAll();
}
