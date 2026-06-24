package com.homelab.monitor.repository;

import com.homelab.monitor.model.MetricSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MetricSnapshotRepository extends JpaRepository<MetricSnapshot, UUID> {

    Page<MetricSnapshot> findByHostIdOrderByCollectedAtDesc(UUID hostId, Pageable pageable);

    Page<MetricSnapshot> findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
            UUID hostId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Optional<MetricSnapshot> findFirstByHostIdOrderByCollectedAtDesc(UUID hostId);

    void deleteByCollectedAtBefore(LocalDateTime cutoff);
}
