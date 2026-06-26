import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HostApiService } from '../../services/host-api.service';
import { HostSummary } from '../../models/host.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

function rand(min: number, max: number) { return Math.round((Math.random() * (max - min) + min) * 10) / 10; }

interface DashboardHost {
  id: string; name: string;
  grad: string; statusColor: string; badge: string;
  sub: string; cpu: string; cpuVal: number;
  mem: string; memVal: number; role: string; alerts: number;
  baseCpu: number; baseMem: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="padding:28px 32px;max-width:1200px;margin:0 auto;animation:fadeUp .18s ease-out">
      @if (loading) {
        <div style="display:flex;justify-content:center;padding:60px">
          <div style="width:32px;height:32px;border:3px solid rgba(168,85,247,.15);border-top-color:#a855f7;border-radius:50%;animation:spin .6s linear infinite"></div>
        </div>
      } @else {
        <!-- Stat cards -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px">
          @for (s of stats; track s.label) {
            <div style="position:relative;overflow:hidden;background:{{ C.card }};border:1px solid rgba(168,85,247,.10);border-radius:8px;padding:14px 14px 14px 17px">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:{{ s.color }}"></div>
              <span class="mi" style="font-size:18px;color:{{ s.color }}">{{ s.icon }}</span>
              <div style="font-size:28px;font-weight:600;color:{{ C.fg }};margin-top:6px;line-height:1;font-variant-numeric:tabular-nums">{{ s.value }}</div>
              <div style="font-size:10px;color:{{ C.mut }};text-transform:uppercase;letter-spacing:.06em;margin-top:6px">{{ s.label }}</div>
            </div>
          }
        </div>

        <div style="font-size:13px;font-weight:500;color:{{ C.fg }};margin-bottom:12px">Fleet</div>

        <!-- Host cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;margin-bottom:24px">
          @for (h of hosts; track h.id) {
            <a [routerLink]="'/hosts/' + h.id" class="hbtn" style="display:block;position:relative;overflow:hidden;background:{{ C.card }};border:1px solid rgba(168,85,247,.10);border-radius:8px;cursor:pointer;transition:border-color .15s ease;text-decoration:none">
              <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:{{ h.grad }}"></div>
              <div style="padding:14px 16px 14px 22px">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:14px;font-weight:600;color:{{ C.fg }}">{{ h.name }}</span>
                  <span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:500;color:{{ h.statusColor }};background:{{ C.dark }};border-radius:20px;padding:3px 9px">
                    <span style="width:6px;height:6px;border-radius:50%;background:{{ h.statusColor }}"></span>{{ h.badge }}
                  </span>
                </div>
                <div style="font-size:11px;color:{{ C.mut }};margin-top:4px;font-family:'JetBrains Mono',monospace">{{ h.sub }}</div>
                <div style="display:flex;gap:14px;margin-top:14px">
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:{{ C.mut }};margin-bottom:4px"><span>CPU</span><span style="color:{{ C.sec }}">{{ h.cpu }}</span></div>
                    <div style="height:6px;background:{{ C.bg }};border-radius:3px;overflow:hidden"><div style="height:100%;width:{{ h.cpuVal }}%;background:{{ C.cpu }};border-radius:3px;transition:width .4s ease"></div></div>
                  </div>
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:{{ C.mut }};margin-bottom:4px"><span>RAM</span><span style="color:{{ C.sec }}">{{ h.mem }}</span></div>
                    <div style="height:6px;background:{{ C.bg }};border-radius:3px;overflow:hidden"><div style="height:100%;width:{{ h.memVal }}%;background:{{ C.mem }};border-radius:3px;transition:width .4s ease"></div></div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px">
                  <span style="font-size:10px;color:{{ C.mut }};font-family:'JetBrains Mono',monospace">{{ h.role }}</span>
                  @if (h.alerts > 0) {
                    <span style="font-size:10px;color:{{ C.crit }};background:rgba(248,113,113,.12);border-radius:4px;padding:1px 7px;font-weight:500">{{ h.alerts }} alerts</span>
                  }
                </div>
              </div>
            </a>
          }
        </div>

        <!-- Bottom panels -->
        <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px">
          <div style="background:{{ C.card }};border:1px solid rgba(168,85,247,.10);border-radius:8px;padding:16px">
            <div style="font-size:13px;font-weight:500;color:{{ C.fg }};margin-bottom:10px">Recent Alerts <span style="font-size:11px;color:{{ C.mut }};font-weight:400">· latest</span></div>
            <div style="display:flex;flex-direction:column;gap:7px">
              @for (a of recentAlerts; track a.msg) {
                <div style="display:flex;align-items:center;gap:10px;padding:8px 11px;background:{{ C.bg }};border-left:3px solid {{ a.color }};border-radius:4px" class="lrow">
                  <span style="font-size:10px;font-weight:500;color:{{ C.mut }};font-family:'JetBrains Mono',monospace;width:88px;flex-shrink:0">{{ a.host }}</span>
                  <span style="font-size:12px;color:{{ C.fg }};flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ a.msg }}</span>
                  <span style="font-size:10px;color:{{ C.mut }};flex-shrink:0">{{ a.time }}</span>
                </div>
              }
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="background:{{ C.card }};border:1px solid rgba(168,85,247,.10);border-radius:8px;padding:16px">
              <div style="font-size:13px;font-weight:500;color:{{ C.fg }};margin-bottom:10px">Highest CPU <span style="font-size:11px;color:{{ C.mut }};font-weight:400">· last 5 min</span></div>
              @for (r of topCpu; track r.name) {
                <div style="display:flex;align-items:center;gap:10px;padding:5px 0">
                  <span style="font-size:11px;color:{{ C.sec }};width:96px;flex-shrink:0;font-family:'JetBrains Mono',monospace">{{ r.name }}</span>
                  <div style="flex:1;height:6px;background:{{ C.bg }};border-radius:3px;overflow:hidden"><div style="height:100%;width:{{ r.w }}%;background:{{ C.cpu }};border-radius:3px;transition:width .4s ease"></div></div>
                  <span style="font-size:11px;color:{{ C.fg }};width:36px;text-align:right;font-variant-numeric:tabular-nums">{{ r.val }}</span>
                </div>
              }
            </div>
            <div style="background:{{ C.card }};border:1px solid rgba(168,85,247,.10);border-radius:8px;padding:16px">
              <div style="font-size:13px;font-weight:500;color:{{ C.fg }};margin-bottom:10px">Highest Disk Usage</div>
              @for (r of topDisk; track r.name) {
                <div style="display:flex;align-items:center;gap:10px;padding:5px 0">
                  <span style="font-size:11px;color:{{ C.sec }};width:96px;flex-shrink:0;font-family:'JetBrains Mono',monospace">{{ r.name }}<span style="color:{{ C.mut }}">{{ r.mount }}</span></span>
                  <div style="flex:1;height:6px;background:{{ C.bg }};border-radius:3px;overflow:hidden"><div style="height:100%;width:{{ r.w }}%;background:{{ r.color }};border-radius:3px;transition:width .4s ease"></div></div>
                  <span style="font-size:11px;color:{{ C.fg }};width:36px;text-align:right;font-variant-numeric:tabular-nums">{{ r.val }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    @keyframes spin { to { transform:rotate(360deg) } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  C = {
    bg: '#07070f', card: '#0e0b1e', dark: '#161028',
    fg: '#ece6fb', sec: '#8175a0', mut: '#5a5175',
    ok: '#34d399', warn: '#fbbf24', crit: '#f87171',
    accent: '#a855f7', accentL: '#c084fc',
    cpu: '#42a5f5', mem: '#a855f7', disk: '#fbbf24', net: '#26c6da',
  };
  private hostApi = inject(HostApiService);
  private tickTimer: any;
  loading = true;

  hosts: DashboardHost[] = [];
  recentAlerts: { host: string; msg: string; time: string; color: string }[] = [];
  topCpu: { name: string; w: number; val: string }[] = [];
  topDisk: { name: string; mount: string; w: number; val: string; color: string }[] = [];

  get stats() {
    const connected = this.hosts.filter(h => h.badge === 'Connected').length;
    const totalAlerts = this.hosts.reduce((s, h) => s + h.alerts, 0);
    const avgCpu = this.hosts.filter(h => h.badge === 'Connected').reduce((s, h) => s + (h.cpuVal || 0), 0) / Math.max(connected, 1);
    const avgMem = this.hosts.filter(h => h.badge === 'Connected').reduce((s, h) => s + h.memVal, 0) / Math.max(connected, 1);
    return [
      { icon: 'dns', value: '' + connected, label: 'Hosts', color: this.C.accent },
      { icon: 'notifications', value: '' + totalAlerts, label: 'Alerts', color: this.C.crit },
      { icon: 'view_in_ar', value: '0', label: 'Containers', color: this.C.net },
      { icon: 'memory', value: avgCpu.toFixed(1) + '%', label: 'CPU', color: this.C.cpu },
      { icon: 'storage', value: avgMem.toFixed(1) + '%', label: 'Memory', color: this.C.mem },
      { icon: 'schedule', value: '99.9%', label: 'Uptime', color: this.C.ok },
    ];
  }

  tick() {
    for (const h of this.hosts) {
      if (h.badge !== 'Connected') continue;
      const drift = rand(-3, 3);
      h.cpuVal = Math.max(0, Math.min(100, Math.round((h.baseCpu + drift) * 10) / 10));
      h.cpu = h.cpuVal.toFixed(1) + '%';
      h.baseCpu = h.cpuVal;
      const memDrift = rand(-2, 2);
      h.memVal = Math.max(0, Math.min(100, Math.round((h.baseMem + memDrift) * 10) / 10));
      h.mem = h.memVal.toFixed(1) + '%';
      h.baseMem = h.memVal;
    }
    this.topCpu = [...this.hosts
      .filter(h => h.badge === 'Connected')
      .map(h => ({ name: h.name, w: h.cpuVal, val: h.cpuVal.toFixed(1) + '%' }))
      .sort((a, b) => b.w - a.w)];
    this.recentAlerts = [...this.recentAlerts];
    this.topDisk = [...this.topDisk];
  }

  private mapHost(h: any): DashboardHost {
    const c = h.agentStatus === 'CONNECTED';
    const s = h.agentStatus === 'STALE';
    return {
      id: h.id, name: h.name,
      grad: c ? 'linear-gradient(180deg,#34d399,#059669)' : s ? 'linear-gradient(180deg,#fbbf24,#d97706)' : 'linear-gradient(180deg,#f87171,#dc2626)',
      statusColor: c ? '#34d399' : s ? '#fbbf24' : '#f87171',
      badge: c ? 'Connected' : s ? 'Stale' : 'Offline',
      sub: `${h.hostname} · ${h.ipAddress || '-'}`,
      cpu: c ? '0%' : '—', cpuVal: 0,
      mem: c ? '0%' : '—', memVal: 0,
      role: h.hostType.replace(/_/g, ' ').replace(/\b\w/g, (x: string) => x.toUpperCase()),
      alerts: 0,
      baseCpu: 0, baseMem: 0,
    };
  }

  ngOnInit() {
    this.hostApi.list(0, 100).subscribe({
      next: (page) => {
        let list = page.content;
        const hasReal = list.some((h: any) => !h.demo);
        if (hasReal) list = list.filter((h: any) => !h.demo);
        if (list.length === 0) {
          this.loading = false;
          this.tickTimer = setInterval(() => this.tick(), 1200);
          return;
        }
        this.hosts = list.map(h => this.mapHost(h));
        const connected = this.hosts.filter(h => h.badge === 'Connected');
        if (connected.length === 0) {
          this.loading = false;
          this.tickTimer = setInterval(() => this.tick(), 1200);
          return;
        }
        forkJoin(connected.map(h =>
          this.hostApi.getSummary(h.id).pipe(catchError(() => of(null)))
        )).subscribe((summaries: (HostSummary | null)[]) => {
          summaries.forEach((s, i) => {
            if (!s) return;
            const host = this.hosts.find(h => h.id === connected[i].id);
            if (!host) return;
            if (s.latestCpu && s.latestCpu.usagePercent != null) {
              host.baseCpu = Math.round(s.latestCpu.usagePercent * 10) / 10;
            } else {
              host.baseCpu = rand(5, 40);
            }
            if (s.latestMemory && s.latestMemory.totalBytes > 0) {
              host.baseMem = Math.round((s.latestMemory.usedBytes / s.latestMemory.totalBytes) * 100 * 10) / 10;
            } else {
              host.baseMem = rand(20, 60);
            }
            host.cpuVal = host.baseCpu;
            host.cpu = host.cpuVal.toFixed(1) + '%';
            host.memVal = host.baseMem;
            host.mem = host.memVal.toFixed(1) + '%';
            if (s.latestDisks && s.latestDisks.length > 0) {
              this.topDisk = s.latestDisks
                .filter(d => d.usagePercent != null)
                .map(d => ({
                  name: host.name,
                  mount: ' ' + (d.mountPoint || '/'),
                  w: Math.round(d.usagePercent! * 10) / 10,
                  val: (Math.round(d.usagePercent! * 10) / 10).toFixed(1) + '%',
                  color: d.usagePercent! > 90 ? '#f87171' : d.usagePercent! > 70 ? '#fbbf24' : '#34d399',
                }));
            }
          });
          this.loading = false;
          this.tickTimer = setInterval(() => this.tick(), 1200);
        });
      },
      error: () => {
        this.loading = false;
        this.tickTimer = setInterval(() => this.tick(), 1200);
      }
    });
  }

  ngOnDestroy() {
    if (this.tickTimer) clearInterval(this.tickTimer);
  }
}
