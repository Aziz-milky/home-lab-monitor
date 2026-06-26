import { Component } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

const C = {
  bg: '#07070f', card: '#0e0b1e', dark: '#161028',
  fg: '#ece6fb', sec: '#8175a0', mut: '#5a5175',
  ok: '#34d399', warn: '#fbbf24', crit: '#f87171',
  accent: '#a855f7',
};

interface AlertRow {
  sev: string;
  sevColor: string;
  sevBg: string;
  border: string;
  host: string;
  hostColor: string;
  msg: string;
  src: string;
  time: string;
  statusLabel: string;
  statusColor: string;
  acknowledged: boolean;
  resolved: boolean;
}

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [NgClass, DatePipe, RouterLink, FormsModule],
  template: `
    <div class="alerts-page">
      <div class="page-header">
        <h1 class="page-title">Alerts</h1>
        <div class="page-subtitle">Fleet-wide alert management · {{ alertCountText }}</div>
      </div>

      <div class="stat-grid">
        @for (s of alertStats; track s.label) {
          <div class="stat-card">
            <div class="stat-strip" [style.background]="s.color"></div>
            <span class="mi" [style.color]="s.color">{{ s.icon }}</span>
            <div>
              <div class="stat-value">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        }
      </div>

      <div class="filter-row">
        <select class="filter-select" [(ngModel)]="selectedSeverity">
          @for (opt of severityOptions; track opt) {
            <option [value]="opt">{{ opt }}</option>
          }
        </select>
        <select class="filter-select" [(ngModel)]="selectedStatus">
          @for (opt of statusOptions; track opt) {
            <option [value]="opt">{{ opt }}</option>
          }
        </select>
      </div>

      <div class="table-card">
        <table class="table">
          <thead>
            <tr>
              <th class="th">Severity</th>
              <th class="th">Host</th>
              <th class="th">Message</th>
              <th class="th">Source</th>
              <th class="th">Triggered</th>
              <th class="th th-right">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (a of filteredAlerts; track a.msg) {
              <tr class="prow" [class.resolved]="a.resolved">
                <td [style.borderLeft]="'2px solid ' + a.border">
                  <span class="sev-chip" [style.color]="a.sevColor" [style.background]="a.sevBg">{{ a.sev }}</span>
                </td>
                <td>
                  <span class="host-cell">
                    <span class="host-dot" [style.background]="a.hostColor"></span>{{ a.host }}
                  </span>
                </td>
                <td class="msg-cell">{{ a.msg }}</td>
                <td class="src-cell">{{ a.src }}</td>
                <td class="time-cell">{{ a.time }}</td>
                <td style="text-align:right">
                  <span class="status-cell" [style.color]="a.statusColor">
                    <span class="status-dot" [style.background]="a.statusColor"></span>{{ a.statusLabel }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .alerts-page { animation: fadeUp .18s ease-out; }
    .page-header { margin-bottom: 18px; }
    .page-title { margin: 0; font-size: 20px; font-weight: 600; color: ${C.fg}; }
    .page-subtitle { font-size: 12px; color: ${C.mut}; margin-top: 4px; }
    .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { position: relative; overflow: hidden; background: ${C.card}; border: 1px solid rgba(168,85,247,.10); border-radius: 8px; padding: 14px 16px 14px 17px; display: flex; align-items: center; gap: 12px; }
    .stat-strip { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
    .mi { font-size: 22px; opacity: .7; }
    .stat-value { font-size: 24px; font-weight: 600; color: ${C.fg}; line-height: 1; font-variant-numeric: tabular-nums; }
    .stat-label { font-size: 10px; color: ${C.mut}; text-transform: uppercase; letter-spacing: .06em; margin-top: 4px; }
    .filter-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .filter-select { background: ${C.dark}; border: 1px solid rgba(168,85,247,.15); border-radius: 6px; color: ${C.fg}; font-size: 12px; padding: 6px 12px; outline: none; }
    .filter-select option { background: ${C.dark}; color: ${C.fg}; }
    .table-card { background: ${C.card}; border: 1px solid rgba(168,85,247,.10); border-radius: 8px; padding: 8px 16px 16px; }
    .table { width: 100%; border-collapse: collapse; }
    .th { font-size: 11px; font-weight: 500; color: ${C.mut}; text-transform: uppercase; letter-spacing: .06em; text-align: left; padding: 10px 10px; }
    .th-right { text-align: right; }
    .prow td { padding: 9px 10px; border-top: 1px solid rgba(168,85,247,.06); }
    .prow:hover { background: rgba(168,85,247,.04); }
    .prow.resolved { opacity: .5; }
    .sev-chip { font-size: 11px; font-weight: 500; border-radius: 4px; padding: 2px 8px; }
    .host-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: ${C.fg}; font-family: 'JetBrains Mono', monospace; }
    .host-dot { width: 6px; height: 6px; border-radius: 50%; }
    .msg-cell { font-size: 13px; color: ${C.fg}; }
    .src-cell { font-size: 12px; color: ${C.sec}; font-family: 'JetBrains Mono', monospace; }
    .time-cell { font-size: 12px; color: ${C.mut}; }
    .status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
  `]
})
export class AlertsComponent {
  C = C;

  severityOptions = ['All', 'Critical', 'Warning', 'Info'];
  statusOptions = ['All', 'Acknowledged', 'Unacknowledged'];
  selectedSeverity = 'All';
  selectedStatus = 'All';

  allAlerts: AlertRow[] = [
    { sev:'Critical', sevColor:C.crit, sevBg:'rgba(248,113,113,0.12)', border:C.crit, host:'grafana', hostColor:'#f97316', msg:'Disk space critical on /var/lib/grafana', src:'node_exporter', time:'2h ago',   statusLabel:'ACTIVE', statusColor:C.crit, acknowledged:false, resolved:false },
    { sev:'Warning',  sevColor:C.warn, sevBg:'rgba(251,191,36,0.12)',  border:C.warn, host:'truenas', hostColor:'#3b82f6', msg:'High memory usage at 87%',           src:'truenas.local', time:'15m ago', statusLabel:'ACTIVE', statusColor:C.crit, acknowledged:false, resolved:false },
    { sev:'Info',     sevColor:'#c084fc', sevBg:'rgba(168,85,247,0.12)', border:'#c084fc', host:'pihole',  hostColor:C.ok,  msg:'DNS query rate stable at 42/s',       src:'pihole',       time:'45m ago', statusLabel:'ACK',   statusColor:C.warn, acknowledged:true,  resolved:false },
    { sev:'Critical', sevColor:C.crit, sevBg:'rgba(248,113,113,0.12)', border:C.crit, host:'proxmox', hostColor:'#fb923c', msg:'Node temperature exceeds 85°C',       src:'proxmox',      time:'10m ago', statusLabel:'ACTIVE', statusColor:C.crit, acknowledged:false, resolved:false },
    { sev:'Warning',  sevColor:C.warn, sevBg:'rgba(251,191,36,0.12)',  border:C.warn, host:'portainer', hostColor:'#14b8a6', msg:"Stack 'monitoring' has 3 restarts",  src:'portainer',    time:'1h ago',  statusLabel:'ACTIVE', statusColor:C.crit, acknowledged:false, resolved:false },
    { sev:'Info',     sevColor:'#c084fc', sevBg:'rgba(168,85,247,0.12)', border:'#c084fc', host:'ollama',  hostColor:C.accent, msg:"Model 'phi:2.7b' inference latency 340ms", src:'ollama',   time:'30m ago', statusLabel:'ACK',   statusColor:C.warn, acknowledged:true,  resolved:false },
    { sev:'Critical', sevColor:C.crit, sevBg:'rgba(248,113,113,0.12)', border:C.crit, host:'grafana', hostColor:'#f97316', msg:'PostgreSQL connection pool exhausted', src:'grafana',      time:'5m ago',  statusLabel:'ACTIVE', statusColor:C.crit, acknowledged:false, resolved:false },
    { sev:'Warning',  sevColor:C.warn, sevBg:'rgba(251,191,36,0.12)',  border:C.warn, host:'pihole',  hostColor:C.ok,  msg:'Blocklist update failed — 3 retries', src:'pihole',   time:'25m ago', statusLabel:'RESOLVED', statusColor:C.ok, acknowledged:true,  resolved:true  },
  ];

  get filteredAlerts(): AlertRow[] {
    return this.allAlerts.filter(a => {
      if (this.selectedSeverity !== 'All' && a.sev !== this.selectedSeverity) return false;
      if (this.selectedStatus === 'Acknowledged' && !a.acknowledged) return false;
      if (this.selectedStatus === 'Unacknowledged' && a.acknowledged) return false;
      return true;
    });
  }

  get activeCount(): number {
    return this.allAlerts.filter(a => !a.resolved && !a.acknowledged).length;
  }

  get ackCount(): number {
    return this.allAlerts.filter(a => a.acknowledged && !a.resolved).length;
  }

  get alertCountText(): string {
    return `${this.activeCount} active, ${this.ackCount} acknowledged`;
  }

  get alertStats() {
    const a = this.allAlerts;
    return [
      { color: C.crit,        icon: 'error',        value: a.filter(x => x.sev === 'Critical').length, label: 'Critical' },
      { color: C.warn,        icon: 'warning',      value: a.filter(x => x.sev === 'Warning').length,  label: 'Warning' },
      { color: '#c084fc',     icon: 'info',         value: a.filter(x => x.sev === 'Info').length,     label: 'Info' },
      { color: C.ok,          icon: 'check_circle', value: a.filter(x => x.acknowledged).length,       label: 'Acknowledged' },
    ];
  }
}
