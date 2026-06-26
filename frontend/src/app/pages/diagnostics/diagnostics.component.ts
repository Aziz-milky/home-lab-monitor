import { Component } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Finding {
  sev: string;
  sevColor: string;
  sevBg: string;
  host: string;
  title: string;
  detail: string;
  action: string;
}

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [NgClass, DatePipe, FormsModule],
  template: `
    <div style="padding:28px 32px;max-width:1200px;margin:0 auto;animation:fadeUp .18s ease-out">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18px">
        <div>
          <h1 style="margin:0;font-size:20px;font-weight:600;color:#ece6fb">Diagnostics</h1>
          <div style="font-size:12px;color:#5a5175;margin-top:4px">AI correlation + heuristics · {{ findings.length }} findings</div>
        </div>
        <div (click)="!running && runDiag()" [style.opacity]="running ? .5 : 1" [style.pointer-events]="running ? 'none' : 'auto'" style="display:flex;align-items:center;gap:7px;height:32px;padding:0 14px;border-radius:7px;font-size:11px;font-weight:500;color:#fff;background:linear-gradient(135deg,#a855f7,#6d28d9);cursor:pointer;transition:opacity .15s">
          <span class="mi" style="font-size:15px;width:15px;height:15px;line-height:15px">auto_awesome</span>
          Run Analysis
        </div>
      </div>
      <div style="position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(168,85,247,.10),rgba(109,40,217,.04));border:1px solid rgba(168,85,247,.22);border-radius:10px;padding:18px 20px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px">
          <span class="mi" style="font-size:18px;width:18px;height:18px;line-height:18px;color:#c084fc">auto_awesome</span>
          <span style="font-size:13px;font-weight:600;color:#ece6fb">Summary</span>
          @if (running) {
            <span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#c084fc;margin-left:6px">
              <span class="pulse-dot"></span>
              analyzing fleet telemetry…
            </span>
          }
        </div>
        <div style="font-size:13px;color:#ece6fb;line-height:1.6;max-width:760px">{{ summary }}</div>
      </div>
      <div style="font-size:13px;font-weight:500;color:#ece6fb;margin-bottom:12px">Detected Issues</div>
      <div style="display:flex;flex-direction:column;gap:14px">
        @for (f of findings; track f.host + f.title) {
          <div style="position:relative;overflow:hidden;background:#0e0b1e;border:1px solid rgba(168,85,247,.10);border-radius:8px;padding:16px 18px 16px 20px">
            <div style="position:absolute;left:0;top:0;bottom:0;width:4px" [style.background]="f.sevColor"></div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <span style="font-size:11px;font-weight:500;border-radius:4px;padding:2px 8px" [style.color]="f.sevColor" [style.background]="f.sevBg">{{ f.sev }}</span>
              <span style="font-size:11px;color:#8175a0;font-family:'JetBrains Mono',monospace">{{ f.host }}</span>
            </div>
            <div style="font-size:14px;font-weight:600;color:#ece6fb;margin-bottom:6px">{{ f.title }}</div>
            <div style="font-size:12px;color:#8175a0;line-height:1.6;max-width:760px">{{ f.detail }}</div>
            <div style="display:flex;align-items:flex-start;gap:8px;margin-top:12px;padding:10px 12px;background:#07070f;border-radius:6px">
              <span class="mi" style="font-size:16px;width:16px;height:16px;line-height:16px;color:#34d399;flex-shrink:0">lightbulb</span>
              <span style="font-size:12px;color:#ece6fb;line-height:1.5">{{ f.action }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #c084fc; display: inline-block; animation: skPulse 1s infinite; }
    @keyframes fadeUp { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
    @keyframes skPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  `]
})
export class DiagnosticsComponent {
  C = {
    bg: '#07070f', card: '#0e0b1e', dark: '#161028',
    fg: '#ece6fb', sec: '#8175a0', mut: '#5a5175',
    ok: '#34d399', warn: '#fbbf24', crit: '#f87171',
    accent: '#a855f7', accentL: '#c084fc',
  };

  running = false;
  summary = 'Run the analysis to detect anomalies across the fleet.';
  findings: Finding[] = [];

  runDiag(): void {
    this.running = true;
    this.summary = 'Scraping heuristic metrics… correlating telemetry streams…';
    setTimeout(() => {
      this.running = false;
      this.findings = this.generateFindings();
      this.summary = this.buildSummary(this.findings);
    }, 2000);
  }

  private buildSummary(f: Finding[]): string {
    if (f.length === 0) return 'All systems nominal. No anomalies detected across monitored endpoints.';
    const c = f.filter(x => x.sev === 'Critical').length;
    const w = f.filter(x => x.sev === 'Warning').length;
    const i = f.filter(x => x.sev === 'Info').length;
    let suffix = 'Routine items noted.';
    if (c > 0) suffix = 'Immediate attention required.';
    else if (w > 0) suffix = 'Review warnings at earliest convenience.';
    return `Analysis complete — ${c} critical, ${w} warning, ${i} informational findings. ${suffix}`;
  }

  private pick<T>(a: T[]): T {
    return a[Math.floor(Math.random() * a.length)];
  }

  private rand(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
  }

  private generateFindings(): Finding[] {
    const hosts = ['grafana.local', 'truenas.local', 'pihole.local', 'nginx-proxy.local', 'prometheus.local', 'homeassistant.local', 'frigate.local', 'unifi.local', 'jellyfin.local', 'node-exporter.local'];
    const sevs = [
      { sev: 'Critical', color: this.C.crit, bg: 'rgba(248,113,113,.12)' },
      { sev: 'Warning', color: this.C.warn, bg: 'rgba(251,191,36,.12)' },
      { sev: 'Info', color: this.C.accent, bg: 'rgba(168,85,247,.12)' },
    ];
    const titles = [
      'Latency spike detected',
      'Memory pressure above threshold',
      'Configuration drift detected',
      'Disk I/O bottleneck',
      'Container restart loop',
      'Certificate expiring soon',
      'Connection pool exhaustion',
      'OOM killer activity',
      'DNS resolution failure',
      'High swap usage',
    ];
    const details: ((h: string) => string)[] = [
      (h: string) => `Response time peaked at ${this.rand(2, 8)}s (p95 baseline ${this.rand(0.3, 1.5)}s) over the last 15 minutes on ${h}. May indicate resource contention.`,
      (h: string) => `Memory at ${this.rand(82, 97)}% on ${h}. Total: ${this.rand(16, 64)} GB, free: ${this.rand(0.5, 8)} GB. No swap activity detected.`,
      (h: string) => `Configuration drifted on ${h} at ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC. Last known good state differs in 3 parameters.`,
      (h: string) => `Average disk latency reached ${this.rand(50, 500)}ms on ${h}. Device ${this.pick(['sda', 'nvme0n1', 'sdb'])} showing queue depth of ${this.rand(4, 64)}.`,
      (h: string) => `Container ${this.pick(['nginx', 'postgres', 'redis', 'mqtt'])} restarted ${Math.floor(this.rand(2, 15))} times in the last hour on ${h}.`,
      (h: string) => `TLS certificate for ${h} expires in ${Math.floor(this.rand(1, 30))} days. Issuer: ${this.pick(["Let's Encrypt", 'ZeroSSL', 'internal CA'])}.`,
      (h: string) => `${Math.floor(this.rand(80, 99))}% of connections in use on ${h}. Pool size: ${Math.floor(this.rand(50, 200))}.`,
      (h: string) => `Process ${this.pick(['java', 'python3', 'node', 'postgres'])} (PID ${Math.floor(this.rand(1000, 99999))}) killed by OOM on ${h}. RSS: ${this.rand(500, 4096)} MB.`,
      (h: string) => `DNS resolution failed for ${this.pick(['api.example.com', 'registry.docker.io', 'github.com'])} from ${h}. Query timeout after ${this.rand(2, 10)}s.`,
      (h: string) => `Swap usage at ${this.rand(10, 85)}% (${this.rand(0.5, 8)} GB / ${this.rand(4, 16)} GB) on ${h}.`,
    ];
    const actions: ((h: string) => string)[] = [
      (h: string) => `Check ${h} resource limits. Review connection pooling and thread pool configuration.`,
      (h: string) => `Adjust memory limits or add RAM to ${h}. Review ${this.pick(['ZFS ARC', 'PostgreSQL shared_buffers', 'Java heap'])} settings.`,
      (h: string) => `Verify change on ${h} was intentional. Update IaC repository if confirmed. Revert via backup if not.`,
      (h: string) => `Investigate disk subsystem on ${h}. Consider ${this.pick(['upgrading to NVMe', 'adding SSD cache', 'balancing I/O across devices'])}.`,
      (h: string) => `Inspect container logs on ${h} via \`docker logs ${this.pick(['nginx', 'postgres', 'redis'])}\`. Check for segfaults or OOM.`,
      (h: string) => `Renew certificate for ${h} via ${this.pick(['certbot', 'acme.sh', 'step-cli'])}. Update monitoring threshold to 14 days.`,
      (h: string) => `Increase connection pool on ${h} or add connection pooling middleware. Review application for connection leaks.`,
      (h: string) => `Add swap or increase memory limits on ${h}. Current limit: ${this.rand(2, 8)} GB. Monitor oom_score_adj.`,
      (h: string) => `Check /etc/resolv.conf on ${h}. Verify upstream DNS servers are reachable. Consider adding fallback resolvers.`,
      (h: string) => `Review swap pressure on ${h}. Add RAM or reduce workload. Check vmstat for si/so activity.`,
    ];

    const count = 3 + Math.floor(Math.random() * 3);
    const result: Finding[] = [];
    const used = new Set<string>();

    for (let i = 0; i < count && result.length < count; i++) {
      const host = this.pick(hosts);
      const sv = this.pick(sevs);
      const title = this.pick(titles);
      const key = host + title;
      if (used.has(key)) { i--; continue; }
      used.add(key);
      result.push({
        sev: sv.sev,
        sevColor: sv.color,
        sevBg: sv.bg,
        host,
        title,
        detail: this.pick(details)(host),
        action: this.pick(actions)(host),
      });
    }

    return result;
  }
}
