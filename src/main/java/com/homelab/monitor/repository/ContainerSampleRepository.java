package com.homelab.monitor.repository;

import com.homelab.monitor.model.ContainerSample;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContainerSampleRepository extends JpaRepository<ContainerSample, UUID> {

    Page<ContainerSample> findByHostIdOrderByCollectedAtDesc(UUID hostId, Pageable pageable);

    Page<ContainerSample> findByHostIdAndCollectedAtBetweenOrderByCollectedAtAsc(
            UUID hostId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<ContainerSample> findByCollectedAtBetweenOrderByCollectedAtAsc(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    Optional<ContainerSample> findFirstByHostIdAndContainerNameOrderByCollectedAtDesc(
            UUID hostId, String containerName);

    void deleteByCollectedAtBefore(LocalDateTime cutoff);
}
