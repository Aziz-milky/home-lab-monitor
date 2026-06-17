package com.homelab.monitor.repository;

import com.homelab.monitor.model.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, UUID> {

    List<AlertRule> findByServiceIdAndEnabledTrue(UUID serviceId);
}
