package com.homelab.monitor.repository;

import com.homelab.monitor.model.CpuSample;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CpuSampleRepository extends JpaRepository<CpuSample, UUID> {

    Page<CpuSample> findByHostIdOrderByCollectedAtDesc(UUID hostId, Pageable pageable);

    Page<CpuSample> findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
            UUID hostId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Optional<CpuSample> findFirstByHostIdOrderByCollectedAtDesc(UUID hostId);

    void deleteByCollectedAtBefore(LocalDateTime cutoff);
}
