# AGENTS.md — Homelab Monitor

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
- **Frontend**: Angular 17 standalone (`frontend/`) — **fully featured UI**
- **Entrypoint**: `MonitorApplication.java`
- **Scheduler**: `SchedulerService.performHealthChecks()` runs every 30s via `@Scheduled(fixedDelay=30000)`
- **Charts**: AG Charts (`ag-charts-community`) on Dashboard (donut) and Service Detail (line)
- **Topology**: `vis-network` force-directed graph on Dashboard showing service dependencies
- **Alerts widget**: Recent alerts feed on Dashboard with quick-acknowledge
- **Diagnostics**: Heuristic analysis engine + optional Ollama AI insights

## Important Gotchas

- **RestTemplate timeouts configured** — Connect timeout 10s, read timeout 30s in `RestTemplateConfig`. No longer blocks the scheduler on hanging services.
- **fixedDelay vs fixedRate** — scheduler uses `fixedDelay` (waits between *completions*), not `fixedRate`. Next run starts 30s after previous finishes.
- **SchedulerService has NO `@Transactional`** — by design (partial failures are acceptable: check saved but rule eval fails). All other services use `@Transactional`.
- **AlertRuleController uses `Map<String, Object>`** for request bodies (not typed DTOs). The `serviceId` is a flat string in the JSON, not a nested object.
- **De-duplication**: Alerts are suppressed if an unacknowledged alert with the same `message` prefix exists for the same service. Matter of `SchedulerService`.
- **`Service.setId(null)`** in `createService` — clients cannot set their own IDs.
- **DB schema is auto-created** (`ddl-auto=update`). No migration files.
- **Seed services are `active=false`** — scheduler skips fake IPs. Set `active=true` in DB or API when registering real services.

## Commands

```bash
./mvnw spring-boot:run      # dev mode
./mvnw package -DskipTests   # production jar
./mvnw test                  # run tests (only 1 context-loads test exists)
```

## Testing

- Single default test at `src/test/java/.../MonitorApplicationTests.java`
- No meaningful test coverage — anything added should mock `RestTemplate` and repositories

## API

All under `localhost:8080/api/`:
- `GET    /services` — list services (paginated, `?page=0&size=20`)
- `POST   /services` — create service
- `GET    /health/latest` — dashboard: all services with latest check
- `GET    /health/service/{id}` — health history for one service (`?page=0&size=50`)
- `GET    /alerts` — list alerts (optional `?acknowledged=false`)
- `PATCH  /alerts/{id}/acknowledge` — toggle acknowledge
- `POST   /alert-rules` — create rule
- `GET    /diagnostics` — heuristic analysis for all services
- `GET    /diagnostics/{id}` — detailed analysis for one service
- `POST   /diagnostics/ai/{id}` — trigger Ollama AI analysis (if enabled)
- `GET    /dependencies` — list all service dependencies for topology graph

## Conventions

- Package: `com.homelab.monitor`
- UUID PKs with `GenerationType.UUID`
- Lombok everywhere: `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- Enums stored as strings (`@Enumerated(EnumType.STRING)`)
- Global 404 handler via `GlobalExceptionHandler` (catches `EntityNotFoundException`)
- Controllers return `ResponseEntity<T>` for explicit HTTP status

## Frontend

- Angular 17 standalone (`bootstrapApplication`, no NgModules)
- Uses Angular Material 17 (indigo-pink theme)
- **Dashboard, Service CRUD, Service Detail, Alerts, Alert Rules** — all implemented
- 15s auto-poll on Dashboard for live status + toast on new alerts
- Covers every backend endpoint
- Dev server proxies `/api` to `localhost:8080` (see `proxy.conf.json`)
- Run with `cd frontend && npm start` (starts on port 4200)
- Build with `npx ng build` (output: `dist/frontend/`)

## Ollama Integration (optional)

Add to `application.properties`:
```properties
ollama.enabled=true
ollama.url=http://localhost:11434
ollama.model=phi:2.7b
```
- The `/api/diagnostics/{id}` endpoint includes heuristic analysis (flapping, trend, anomaly, uptime).
- `POST /api/diagnostics/ai/{id}` sends health context to Ollama and returns natural-language insights.
- If Ollama is not configured/available, diagnostics return heuristic data with an "AI unavailable" message.

### GPU Note
- **MX130 (CC 5.0) is too old for CUDA 13+** — Ollama runs on CPU only via `phi:2.7b`.
- ~12s per inference query — acceptable for occasional manual diagnostics.
- Systemd user service at `~/.config/systemd/user/ollama.service`.
- Manage: `systemctl --user {start,stop,restart,status} ollama`.

## Seed Data

For testing without real services, add to `application.properties`:
```properties
seed.enabled=true
```
- On next startup, creates 6 fake services (Grafana, TrueNAS, Pi-hole, Ollama, Proxmox, Portainer) with ~100 health checks each, 4 alert rules, and 2 sample alerts.
- Only runs if no services exist yet (safe to leave enabled).
- Seed services are `active=false` by default — the scheduler will skip them. Set `active=true` manually to start monitoring real endpoints.
