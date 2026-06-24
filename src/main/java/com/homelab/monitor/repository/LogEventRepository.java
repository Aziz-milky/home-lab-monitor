package com.homelab.monitor.repository;

import com.homelab.monitor.model.LogEvent;
import com.homelab.monitor.model.LogLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LogEventRepository extends JpaRepository<LogEvent, UUID> {

    Page<LogEvent> findByHostIdOrderByTimestampDesc(UUID hostId, Pageable pageable);

    Page<LogEvent> findByHostIdAndTimestampBetweenOrderByTimestampDesc(
            UUID hostId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<LogEvent> findByHostIdAndLevelOrderByTimestampDesc(
            UUID hostId, LogLevel level, Pageable pageable);

    Page<LogEvent> findByHostIdAndSourceContainingIgnoreCaseOrderByTimestampDesc(
            UUID hostId, String source, Pageable pageable);

    Page<LogEvent> findByHostIdAndLevelAndTimestampBetweenOrderByTimestampDesc(
            UUID hostId, LogLevel level, LocalDateTime from, LocalDateTime to, Pageable pageable);

    void deleteByTimestampBefore(LocalDateTime cutoff);
}
