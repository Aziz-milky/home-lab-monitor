package com.homelab.monitor.repository;

import com.homelab.monitor.model.MemorySample;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemorySampleRepository extends JpaRepository<MemorySample, UUID> {

    Page<MemorySample> findByHostIdOrderByCollectedAtDesc(UUID hostId, Pageable pageable);

    Page<MemorySample> findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
            UUID hostId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Optional<MemorySample> findFirstByHostIdOrderByCollectedAtDesc(UUID hostId);

    void deleteByCollectedAtBefore(LocalDateTime cutoff);
}
