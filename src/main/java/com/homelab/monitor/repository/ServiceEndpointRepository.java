package com.homelab.monitor.repository;

import com.homelab.monitor.model.ServiceEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServiceEndpointRepository extends JpaRepository<ServiceEndpoint, UUID> {

    List<ServiceEndpoint> findByHostId(UUID hostId);

    void deleteByHostId(UUID hostId);
}
