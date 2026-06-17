# Homelab Monitor

A Spring Boot service that monitors self-hosted services, records health checks, evaluates alert rules, and generates alerts.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [REST API Reference](#rest-api-reference)
  - [Services](#1-services---apiservices)
  - [Health Checks](#2-health-checks---apihealth)
  - [Alert Rules](#3-alert-rules---apialert-rules)
  - [Alerts](#4-alerts---apialerts)
- [How the Scheduler Works](#how-the-scheduler-works)
- [Alert Rule Types](#alert-rule-types)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Java 26+** (Spring Boot 4 requires Java 26)
- **PostgreSQL** running on `localhost:5432`
- **Maven** (bundled via `./mvnw`)

---

## Quick Start

```bash
# 1. Clone and enter the project
cd homelab-monitor

# 2. Create the database
psql -U postgres -c "CREATE DATABASE homelab_monitor;"

# 3. Update credentials in application.properties
#    vi src/main/resources/application.properties

# 4. Build and run
./mvnw spring-boot:run

# 5. Verify it's running
curl http://localhost:8080/api/services
# → {"content":[],...}  (empty, no services yet)
```

---

## Configuration

Edit `src/main/resources/application.properties`:

```properties
# ── PostgreSQL ──────────────────────────────────────────────
spring.datasource.url=jdbc:postgresql://localhost:5432/homelab_monitor
spring.datasource.username=postgres
spring.datasource.password=yourpassword

# ── JPA / Hibernate ─────────────────────────────────────────
spring.jpa.hibernate.ddl-auto=update   # auto-creates tables on startup
spring.jpa.show-sql=true               # logs SQL (disable in production)

# ── Server ──────────────────────────────────────────────────
server.port=8080
```

Tables are created automatically by Hibernate. No manual schema setup needed.

---

## Running the Application

```bash
# Development mode (with live reload)
./mvnw spring-boot:run

# Production build
./mvnw package -DskipTests
java -jar target/monitor-0.0.1-SNAPSHOT.jar
```

The scheduler runs every **30 seconds** (configured in `SchedulerService.java`).

---

## REST API Reference

### 1. Services — `/api/services`

Full CRUD for monitored services.

**Create a service:**
```bash
curl -X POST http://localhost:8080/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "host": "192.168.1.100",
    "port": 8080,
    "serviceType": "GENERIC",
    "checkUrl": "http://192.168.1.100:8080/health",
    "active": true
  }'
```
Save the returned `id` — you need it for alert rules.

**List services (paginated):**
```bash
curl "http://localhost:8080/api/services?page=0&size=20"
```

**Get service by ID:**
```bash
curl http://localhost:8080/api/services/<uuid>
```

**Update service:**
```bash
curl -X PUT http://localhost:8080/api/services/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","host":"192.168.1.100","port":8080,"serviceType":"GENERIC","checkUrl":"http://192.168.1.100:8080/health","active":true}'
```

**Delete service:**
```bash
curl -X DELETE http://localhost:8080/api/services/<uuid>
```

**Service types:** `PROXMOX`, `TRUENAS`, `PIHOLE`, `GRAFANA`, `OLLAMA`, `GENERIC`

---

### 2. Health Checks — `/api/health`

**Latest status for all services:**
```bash
curl http://localhost:8080/api/health/latest
```
Returns each service with their most recent health check result or `"UNKNOWN"`.

**Health history for a specific service:**
```bash
curl "http://localhost:8080/api/health/service/<uuid>?limit=50"
```

---

### 3. Alert Rules — `/api/alert-rules`

Full CRUD for configuring when alerts should fire.

**Create a rule:**
```bash
curl -X POST http://localhost:8080/api/alert-rules \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "<service-uuid>",
    "ruleType": "RESPONSE_TIME",
    "thresholdMs": 500,
    "failureCount": null,
    "enabled": true
  }'
```

**Create a failure-count rule:**
```bash
curl -X POST http://localhost:8080/api/alert-rules \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "<service-uuid>",
    "ruleType": "FAILURE_COUNT",
    "thresholdMs": null,
    "failureCount": 3,
    "enabled": true
  }'
```

**List all rules (paginated):**
```bash
curl "http://localhost:8080/api/alert-rules?page=0&size=20"
```

**Get rule by ID:**
```bash
curl http://localhost:8080/api/alert-rules/<uuid>
```

**Update rule (partial):**
```bash
curl -X PUT http://localhost:8080/api/alert-rules/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

**Toggle enable/disable:**
```bash
curl -X PATCH http://localhost:8080/api/alert-rules/<uuid>/toggle
```

**Delete rule:**
```bash
curl -X DELETE http://localhost:8080/api/alert-rules/<uuid>
```

---

### 4. Alerts — `/api/alerts`

**List alerts (paginated):**
```bash
curl "http://localhost:8080/api/alerts?page=0&size=20"
```

**Filter by acknowledged status:**
```bash
curl "http://localhost:8080/api/alerts?acknowledged=false&page=0&size=20"
curl "http://localhost:8080/api/alerts?acknowledged=true&page=0&size=20"
```

**Acknowledge (toggle) an alert:**
```bash
curl -X PATCH http://localhost:8080/api/alerts/<uuid>/acknowledge
```
- First call: marks as acknowledged and sets `acknowledgedAt`
- Second call: un-acknowledges and clears the timestamp

**Delete an alert:**
```bash
curl -X DELETE http://localhost:8080/api/alerts/<uuid>
```

---

## How the Scheduler Works

```
Every 30 seconds
       │
       ▼
  For each active service:
       │
       ├──▶ HTTP GET checkUrl ──▶ Record HealthCheck (status, time, error)
       │
       └──▶ Evaluate all enabled AlertRules for this service
                │
                ├── RESPONSE_TIME ──▶ responseTimeMs > thresholdMs?
                │                        YES ──▶ Create Alert (WARNING/CRITICAL)
                │
                └── FAILURE_COUNT ──▶ last N checks all DOWN?
                                         YES ──▶ Create Alert (CRITICAL)
```

**De-duplication:** If an unacknowledged alert with the same message prefix already exists for the service, no new alert is created (prevents flooding).

---

## Alert Rule Types

| Rule Type | Fields | Behavior | Severity |
|---|---|---|---|
| `RESPONSE_TIME` | `thresholdMs` | Response time exceeds threshold | WARNING |
| `RESPONSE_TIME` | `thresholdMs` | Response time exceeds 2× threshold | CRITICAL |
| `FAILURE_COUNT` | `failureCount` | Last N consecutive health checks are DOWN | CRITICAL |

**Example rule configurations:**

```json
// Alert if response time > 1000ms (WARNING) or > 2000ms (CRITICAL)
{"ruleType": "RESPONSE_TIME", "thresholdMs": 1000, "failureCount": null, "enabled": true}

// Alert if 3 consecutive health checks fail
{"ruleType": "FAILURE_COUNT", "thresholdMs": null, "failureCount": 3, "enabled": true}
```

---

## Database Schema

All tables are auto-created by Hibernate (`ddl-auto=update`).

```
services
├── id              UUID  PK
├── name            VARCHAR(255)  NOT NULL
├── host            VARCHAR(255)  NOT NULL
├── port            INT  NOT NULL
├── service_type    VARCHAR(255)  NOT NULL  (PROXMOX|TRUENAS|PIHOLE|GRAFANA|OLLAMA|GENERIC)
├── check_url       VARCHAR(255)
├── active          BOOLEAN  NOT NULL
└── created_at      TIMESTAMP  NOT NULL

health_checks
├── id              UUID  PK
├── service_id      UUID  FK → services(id)  NOT NULL
├── status          VARCHAR(255)  NOT NULL  (UP|DOWN)
├── response_time_ms INT
├── http_status     INT
├── error_message   TEXT
└── checked_at      TIMESTAMP  NOT NULL

alert_rules
├── id              UUID  PK
├── service_id      UUID  FK → services(id)  NOT NULL
├── rule_type       VARCHAR(255)  NOT NULL  (RESPONSE_TIME|FAILURE_COUNT)
├── threshold_ms    INT
├── failure_count   INT
└── enabled         BOOLEAN  NOT NULL

alerts
├── id              UUID  PK
├── service_id      UUID  FK → services(id)  NOT NULL
├── severity        VARCHAR(255)  NOT NULL  (INFO|WARNING|CRITICAL)
├── message         TEXT  NOT NULL
├── acknowledged    BOOLEAN  NOT NULL
├── triggered_at    TIMESTAMP  NOT NULL
└── acknowledged_at TIMESTAMP
```

---

## Complete Workflow Example

```bash
#!/usr/bin/env bash
BASE="http://localhost:8080"

# 1. Create a service
echo "=== Creating service ==="
SVC=$(curl -s -X POST "$BASE/api/services" \
  -H "Content-Type: application/json" \
  -d '{"name":"Grafana","host":"192.168.1.5","port":3000,"serviceType":"GRAFANA","checkUrl":"http://192.168.1.5:3000/health","active":true}' | jq -r '.id')
echo "Service ID: $SVC"

# 2. Create alert rules
echo "=== Creating alert rules ==="
curl -s -X POST "$BASE/api/alert-rules" \
  -H "Content-Type: application/json" \
  -d "{\"serviceId\":\"$SVC\",\"ruleType\":\"RESPONSE_TIME\",\"thresholdMs\":500,\"failureCount\":null,\"enabled\":true}" | jq
curl -s -X POST "$BASE/api/alert-rules" \
  -H "Content-Type: application/json" \
  -d "{\"serviceId\":\"$SVC\",\"ruleType\":\"FAILURE_COUNT\",\"thresholdMs\":null,\"failureCount\":3,\"enabled\":true}" | jq

# 3. Wait 30s for the scheduler, then check health
sleep 35
echo "=== Latest health ==="
curl -s "$BASE/api/health/latest" | jq

# 4. View alerts
echo "=== Unacknowledged alerts ==="
curl -s "$BASE/api/alerts?acknowledged=false" | jq

# 5. Acknowledge the first alert
AID=$(curl -s "$BASE/api/alerts" | jq -r '.content[0].id // empty')
if [ -n "$AID" ]; then
  echo "=== Acknowledging alert $AID ==="
  curl -s -X PATCH "$BASE/api/alerts/$AID/acknowledge" | jq
fi
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `401` on startup | Wrong DB credentials | Update `application.properties` |
| `database "homelab_monitor" does not exist` | DB not created | `psql -U postgres -c "CREATE DATABASE homelab_monitor;"` |
| Tables not created | Wrong `spring.jpa.hibernate.ddl-auto` | Set to `update` (not `none`/`validate`) |
| No health checks running | Service not active | Set `"active": true` when creating service |
| No alerts firing | No rules created or rules not enabled | Check `/api/alert-rules` and ensure `enabled: true` |
| Too many alerts for same issue | De-duplication not working | Check for unacknowledged alerts — a new one is skipped if one already exists |
