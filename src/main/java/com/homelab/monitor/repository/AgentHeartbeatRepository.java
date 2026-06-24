package com.homelab.monitor.repository;

import com.homelab.monitor.model.AgentHeartbeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentHeartbeatRepository extends JpaRepository<AgentHeartbeat, UUID> {

    Optional<AgentHeartbeat> findFirstByHostIdOrderByReceivedAtDesc(UUID hostId);

    List<AgentHeartbeat> findByHostIdAndReceivedAtAfter(UUID hostId, LocalDateTime after);

    List<AgentHeartbeat> findByReceivedAtBefore(LocalDateTime cutoff);

    void deleteByReceivedAtBefore(LocalDateTime cutoff);
}
