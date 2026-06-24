package com.homelab.monitor.repository;

import com.homelab.monitor.model.AgentStatus;
import com.homelab.monitor.model.Host;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HostRepository extends JpaRepository<Host, UUID> {

    Optional<Host> findByAgentId(UUID agentId);

    Optional<Host> findByAuthToken(String authToken);

    List<Host> findByAgentStatus(AgentStatus agentStatus);

    List<Host> findByActiveTrue();
}
