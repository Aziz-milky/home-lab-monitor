package com.homelab.monitor.repository;

import com.homelab.monitor.model.Alert;
import com.homelab.monitor.model.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {

    Page<Alert> findByAcknowledgedOrderByTriggeredAtDesc(boolean acknowledged, Pageable pageable);

    List<Alert> findByAcknowledgedOrderByTriggeredAtDesc(boolean acknowledged);

    Page<Alert> findAllByOrderByTriggeredAtDesc(Pageable pageable);

    List<Alert> findAllByOrderByTriggeredAtDesc();

    Optional<Alert> findFirstByServiceAndAcknowledgedAndMessageStartingWith(
            Service service, boolean acknowledged, String messagePrefix);
}
