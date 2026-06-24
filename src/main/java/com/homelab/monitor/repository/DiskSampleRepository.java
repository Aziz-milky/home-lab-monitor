package com.homelab.monitor.repository;

import com.homelab.monitor.model.DiskSample;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DiskSampleRepository extends JpaRepository<DiskSample, UUID> {

    Page<DiskSample> findByHostIdOrderByCollectedAtDesc(UUID hostId, Pageable pageable);

    Page<DiskSample> findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
            UUID hostId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    List<DiskSample> findTop5ByHostIdOrderByCollectedAtDesc(UUID hostId);

    void deleteByCollectedAtBefore(LocalDateTime cutoff);
}
