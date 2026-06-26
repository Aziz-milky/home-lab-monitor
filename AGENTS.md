# AGENTS.md — Sentinel Homelab Monitor (v2)

## Quick Start

```bash
# prerequisites: Java 26+, PostgreSQL running on localhost:5432
psql -U postgres -c "CREATE DATABASE homelab_monitor;"
# edit src/main/resources/application.properties — set password
./mvnw spring-boot:run

# OR — test locally without PostgreSQL (uses H2 in-memory + seed data)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

## Architecture

- **Backend**: Spring Boot 4 (Java 26), Maven, PostgreSQL, JPA/Hibernate
- **Frontend**: Angular 17 standalone (`frontend/`) — 10 pages, all lazy-loaded
- **Entrypoint**: `MonitorApplication.java`
- **Scheduler**: `SchedulerService` — runs `performHealthChecks()` every 30s (`fixedDelay=30000`) + `evaluateRules()` + `purgeOldData()` hourly
- **Agent module** (`monitor-agent/`): Separate Spring Boot JAR that collects system metrics + Docker stats and ships to the server via REST API
- **Metric extraction**: `MetricExtractorService` — parses incoming metric payloads at ingestion time into 7 typed sample tables (CPU, Memory, Disk, Network, Container, Process, Log)
- **Charts**: Inline SVG sparklines (small cards) + AG Charts Community v13 (full-size charts)
- **Topology**: `vis-network` force-directed graph with filter toggles + side panel
- **Diagnostics**: Heuristic analysis engine + optional Ollama AI insights

## Important Gotchas

- **SchedulerService has NO `@Transactional`** — by design (partial failures acceptable: check saved but rule eval fails). All other services use `@Transactional`.
- **De-duplication**: Alerts are suppressed if an unacknowledged alert with the same message prefix exists for the same host. Handled by both `SchedulerService` and `AlertRuleEvaluatorService`.
- **DB schema is auto-created** (`ddl-auto=update`). No migration files.
- **Agent token auth**: Inline Bearer validation in `AgentController`/`AgentLogController` via `validateToken()` helper. No separate filter.
- **Stale agent detection**: 90s without heartbeat → STALE status.
- **Extraction-at-ingestion-time**: Typed sample tables populated immediately when metrics arrive (not batch).

## Commands

```bash
./mvnw spring-boot:run          # dev mode
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod  # prod mode (PostgreSQL)
./mvnw package -DskipTests       # production jar
./mvnw test                      # run tests
cd frontend && npm start         # Angular dev server (port 4200)
cd frontend && npx ng build      # production build → dist/frontend/
```

## Testing

- Single default test at `src/test/java/.../MonitorApplicationTests.java`
- No meaningful coverage — anything added should mock `RestTemplate` and repositories

## API

### v2 Agent Endpoints (`/api/agents`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents` | Register agent (creates Host) |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/{id}` | Agent detail |
| POST | `/api/agents/{id}/metrics` | Ship metric snapshot (JSON payload) |
| POST | `/api/agents/{id}/heartbeat` | Agent heartbeat |
| POST | `/api/agents/{id}/logs` | Ship log entries |
| DELETE | `/api/agents/{id}` | Deregister agent |

### v2 Host Query Endpoints (`/api/hosts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hosts` | List all hosts |
| GET | `/api/hosts/{id}` | Host detail |
| GET | `/api/hosts/{id}/summary` | Summary (status, uptime, alert count) |
| GET | `/api/hosts/{id}/cpu` | CPU samples (paginated, `?page=0&size=60`) |
| GET | `/api/hosts/{id}/memory` | Memory samples |
| GET | `/api/hosts/{id}/disks` | Disk samples |
| GET | `/api/hosts/{id}/network` | Network samples |
| GET | `/api/hosts/{id}/containers` | Container samples |
| GET | `/api/hosts/{id}/processes` | Process samples |
| GET | `/api/hosts/{id}/endpoints` | Service endpoints |
| GET | `/api/hosts/{id}/logs` | Log entries (`?level=WARN&page=0&size=50`) |
| GET | `/api/hosts/{id}/alerts` | Host alerts |

### v2 Fleet Endpoints (`/api/fleet`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fleet/overview` | Fleet-wide stats (host count, total containers, alert counts, avg CPU/memory) |
| GET | `/api/fleet/containers` | All containers across fleet |
| GET | `/api/fleet/topology` | Inter-host topology edges |

### v1 Legacy Endpoints (still present)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/services` | Legacy service CRUD |
| GET | `/api/services/{id}` | Legacy service detail |
| GET | `/api/health/latest` | Legacy health dashboard |
| GET | `/api/health/service/{id}` | Legacy health history |
| GET | `/api/alerts` | List alerts (`?acknowledged=false`) |
| PATCH | `/api/alerts/{id}/acknowledge` | Toggle acknowledge |
| POST | `/api/alert-rules` | Create rule |
| GET | `/api/diagnostics` | Heuristic analysis for all services |
| GET | `/api/diagnostics/{id}` | Detailed analysis for one service |
| POST | `/api/diagnostics/ai/{id}` | Ollama AI analysis |
| GET | `/api/dependencies` | Service dependency edges |

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | DashboardComponent | Fleet overview: stat bar + host card grid + top resource usage |
| `/hosts` | HostsComponent | Registered hosts card grid |
| `/hosts/:id` | HostDetailComponent | 7-tab host cockpit (Overview, CPU&Memory, Disk, Network, Containers, Logs, Alert Rules) |
| `/topology` | TopologyComponent | vis-network force graph + filter toggles + side panel |
| `/logs` | LogsComponent | Fleet-wide log viewer with level/host/search filters + follow mode |
| `/containers` | ContainersComponent | Fleet container cards with status filter + drawer detail panel |
| `/services` | ServiceListComponent | Legacy service list |
| `/services/:id` | ServiceDetailComponent | Legacy service detail |
| `/alerts` | AlertsComponent | Alert management: stat cards + severity/status filters + table |
| `/alert-rules` | AlertRulesComponent | Rule definitions table + inline add dialog + toggle switches |
| `/diagnostics` | DiagnosticsComponent | AI correlation summary + heuristic findings feed |

### Frontend conventions
- Standalone components everywhere (no NgModules), inline templates + styles
- Dark theme: `bg:#07070f`, `card:#0e0b1e`, `dark:#161028`, `fg:#ece6fb`, `accent:#a855f7`
- No Angular Material tables or dialogs — native HTML tables + custom modals
- No mat-slide-toggle — custom toggle switches
- Colors, spacing, layout match design prototype pixel-for-pixel
- All pages use `loading` state with shimmer skeleton animation

## Conventions

- Package: `com.homelab.monitor`
- UUID PKs with `GenerationType.UUID`
- Lombok everywhere: `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- Enums stored as strings (`@Enumerated(EnumType.STRING)`)
- Global 404 handler via `GlobalExceptionHandler` (catches `EntityNotFoundException`)
- Controllers return `ResponseEntity<T>` for explicit HTTP status
- Jackson 3.x (`tools.jackson.databind.*`), not Jackson 2.x (`com.fasterxml.jackson.*`)
- TEXT column for `MetricSnapshot` payload (not JSONB), Jackson 3.x manual serialization

## Agent Module (`monitor-agent/`)

- Separate Spring Boot JAR with `AgentApplication.java`
- **SystemMetricsCollector**: Reads `/proc/stat`, `/proc/meminfo`, `/proc/diskstats`, `/proc/net/dev`, `/proc/{pid}/stat`
- **DockerMetricsCollector**: Calls `docker stats --no-stream` CLI + `docker ps` for container status
- **AgentLifecycleService**: Registration, heartbeat (10s interval), metric collection (30s interval)
- **SentinelApiClient**: REST client to ship metrics to server
- Runs on `arch-milk` (Arch), targets `http://10.43.145.156:8080/api`
- Token-based auth, state persisted at `~/.sentinel/agent.json`

## Data Retention (Phase 5)

Configured in `application.properties`:
```properties
retention.cpu-days=7
retention.memory-days=7
retention.disk-days=7
retention.network-days=7
retention.container-days=3
retention.process-days=1
retention.log-days=7
retention.metric-snapshot-days=1
retention.heartbeat-days=30
```

- `DataRetentionService.purgeOldData()` scheduled via `@Scheduled(cron = "0 0 * * * *")` — runs every hour.

## Extended Alert Rules (Phase 4)

| `ruleType` | Source | Condition syntax |
|---|---|---|
| `CPU_PERCENT` | CpuSample.usagePercent | `threshold (e.g., > 90)` |
| `MEMORY_PERCENT` | MemorySample (used/total * 100) | `> 90` |
| `DISK_PERCENT` | DiskSample.usagePercent | `> 90` |
| `AGENT_DISCONNECTED` | AgentHeartbeat.receivedAt (>90s stale) | `= true` |
| `CONTAINER_DOWN` | ContainerSample.status | `= stopped` |

- Evaluated by `AlertRuleEvaluatorService.evaluateRules()` called after each health check cycle.
- De-duplication: same message prefix + host → suppressed if unacknowledged alert exists.

## Ollama Integration (optional)

```properties
ollama.enabled=true
ollama.url=http://localhost:11434
ollama.model=phi:2.7b
```
- `POST /api/diagnostics/ai/{id}` sends health context to Ollama, returns natural-language insights.
- Runs CPU-only on MX130 (CC 5.0, too old for CUDA 13+). ~12s per inference.
- Systemd user service: `systemctl --user {start,stop,restart,status} ollama`

## Seed Data

```properties
seed.enabled=true
```
- Creates sample hosts + health checks + alert rules + alerts on startup (if no data exists).
- Seed hosts are `active=false` — scheduler skips them. Set `active=true` manually for real monitoring.
