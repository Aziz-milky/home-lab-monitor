package com.homelab.monitor.repository;

import com.homelab.monitor.model.HealthCheck;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface HealthCheckRepository extends JpaRepository<HealthCheck, UUID> {

    Page<HealthCheck> findByServiceIdOrderByCheckedAtDesc(UUID serviceId, Pageable pageable);

    Optional<HealthCheck> findFirstByServiceIdOrderByCheckedAtDesc(UUID serviceId);
}
