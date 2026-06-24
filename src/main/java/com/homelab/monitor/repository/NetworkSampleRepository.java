package com.homelab.monitor.repository;

import com.homelab.monitor.model.NetworkSample;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface NetworkSampleRepository extends JpaRepository<NetworkSample, UUID> {

    Page<NetworkSample> findByHostIdOrderByCollectedAtDesc(UUID hostId, Pageable pageable);

    Page<NetworkSample> findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
            UUID hostId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    void deleteByCollectedAtBefore(LocalDateTime cutoff);
}
