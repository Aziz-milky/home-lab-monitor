import { Component } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

const C = {
  bg: '#07070f', card: '#0e0b1e', dark: '#161028',
  fg: '#ece6fb', sec: '#8175a0', mut: '#5a5175',
  ok: '#34d399', warn: '#fbbf24', crit: '#f87171',
  accent: '#a855f7', accentL: '#c084fc',
};

@Component({
  selector: 'app-alert-rules',
  standalone: true,
  imports: [NgClass, DatePipe, FormsModule],
  template: `
    <div style="animation:fadeUp .18s ease-out">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18px">
        <div>
          <h1 style="margin:0;font-size:20px;font-weight:600;color:${C.fg}">Alert Rules</h1>
          <div style="font-size:12px;color:${C.mut};margin-top:4px">Fleet-wide rule definitions</div>
        </div>
        <div (click)="openAddRule()" style="display:flex;align-items:center;gap:6px;height:32px;padding:0 13px;border-radius:7px;font-size:11px;font-weight:500;color:#fff;background:linear-gradient(135deg,#a855f7,#6d28d9);cursor:pointer">
          <span class="mi" style="font-size:15px;width:15px;height:15px">add</span>Add Rule
        </div>
      </div>
      <div style="background:${C.card};border:1px solid rgba(168,85,247,.10);border-radius:8px;padding:8px 16px 16px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="font-size:11px;font-weight:500;color:${C.mut};text-transform:uppercase;letter-spacing:.07em;text-align:left;padding:10px 10px">Name</th>
              <th style="font-size:11px;font-weight:500;color:${C.mut};text-transform:uppercase;letter-spacing:.07em;text-align:left;padding:10px 10px">Scope</th>
              <th style="font-size:11px;font-weight:500;color:${C.mut};text-transform:uppercase;letter-spacing:.07em;text-align:left;padding:10px 10px">Type</th>
              <th style="font-size:11px;font-weight:500;color:${C.mut};text-transform:uppercase;letter-spacing:.07em;text-align:left;padding:10px 10px">Condition</th>
              <th style="font-size:11px;font-weight:500;color:${C.mut};text-transform:uppercase;letter-spacing:.07em;text-align:left;padding:10px 10px">Severity</th>
              <th style="font-size:11px;font-weight:500;color:${C.mut};text-transform:uppercase;letter-spacing:.07em;text-align:right;padding:10px 10px">Fired</th>
              <th style="font-size:11px;font-weight:500;color:${C.mut};text-transform:uppercase;letter-spacing:.07em;text-align:right;padding:10px 10px">Enabled</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rules; track r.id) {
              <tr class="ar-row" style="border-top:1px solid rgba(168,85,247,.06)">
                <td style="font-size:13px;color:${C.fg};padding:9px 10px">{{ r.name }}</td>
                <td style="font-size:12px;color:${C.sec};padding:9px 10px;font-family:'JetBrains Mono',monospace">{{ r.scope }}</td>
                <td style="font-size:12px;color:${C.sec};padding:9px 10px;font-family:'JetBrains Mono',monospace">{{ r.type }}</td>
                <td style="font-size:12px;color:${C.sec};padding:9px 10px;font-family:'JetBrains Mono',monospace">{{ r.cond }}</td>
                <td style="padding:9px 10px">
                  <span [style.color]="sevC[r.sev].c" [style.background]="sevC[r.sev].bg" style="font-size:11px;font-weight:500;border-radius:4px;padding:2px 8px">{{ r.sev }}</span>
                </td>
                <td style="font-size:12px;color:${C.sec};padding:9px 10px;text-align:right;font-variant-numeric:tabular-nums">{{ r.fired }}</td>
                <td style="padding:9px 10px;text-align:right">
                  <span (click)="toggleRule(r)" [style.background]="r.on ? C.accent : C.dark" style="display:inline-block;width:30px;height:17px;border-radius:9px;position:relative;cursor:pointer;transition:.15s ease;vertical-align:middle">
                    <span [style.left]="r.on ? '15px' : '2px'" style="position:absolute;top:2px;width:13px;height:13px;border-radius:50%;background:#fff;transition:.15s ease"></span>
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (addRuleOpen) {
      <div (click)="closeAddRule()" style="position:fixed;inset:0;background:rgba(7,7,15,.6);backdrop-filter:blur(2px);z-index:300;display:flex;align-items:center;justify-content:center">
        <div (click)="$event.stopPropagation()" style="width:440px;background:#1d1535;border:1px solid rgba(168,85,247,.20);border-radius:12px;padding:22px;animation:fadeUp .18s ease-out">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
            <span style="font-size:16px;font-weight:600;color:${C.fg}">Add Alert Rule</span>
            <span class="mi" (click)="closeAddRule()" style="font-size:20px;color:${C.sec};cursor:pointer">close</span>
          </div>
          <label style="font-size:11px;color:${C.mut};text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Rule Type</label>
          <select [(ngModel)]="ruleType" style="width:100%;background:${C.bg};color:${C.fg};border:1px solid rgba(168,85,247,.10);border-radius:7px;padding:9px 11px;font-size:13px;font-family:inherit;outline:none">
            @for (t of ruleTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">
            @for (f of ruleFields; track f.label) {
              <div>
                <label style="font-size:11px;color:${C.mut};text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">{{ f.label }}</label>
                <input [placeholder]="f.placeholder" style="width:100%;background:${C.bg};border:1px solid rgba(168,85,247,.10);border-radius:7px;padding:9px 11px;color:${C.fg};font-size:13px;font-family:inherit;outline:none" />
              </div>
            }
          </div>
          <div style="display:flex;gap:10px;margin-top:22px">
            <div (click)="closeAddRule()" style="flex:1;text-align:center;padding:10px;border:1px solid rgba(168,85,247,.10);border-radius:7px;font-size:12px;color:${C.sec};cursor:pointer">Cancel</div>
            <div (click)="closeAddRule()" style="flex:1;text-align:center;padding:10px;border-radius:7px;font-size:12px;font-weight:500;color:#fff;background:linear-gradient(135deg,#a855f7,#6d28d9);cursor:pointer">Create Rule</div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 28px 32px; }
    .ar-row:hover { background: rgba(168,85,247,.04); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AlertRulesComponent {
  C = C;

  rules = [
    { id: 0, name: 'High CPU sustained', scope: 'all hosts', type: 'CPU_PERCENT', cond: '> 90% for 3 checks', sev: 'WARN', fired: 12, on: true },
    { id: 1, name: 'Memory pressure', scope: 'all hosts', type: 'MEMORY_PERCENT', cond: '> 85%', sev: 'WARN', fired: 8, on: true },
    { id: 2, name: 'Root disk filling', scope: 'proxmox-01', type: 'DISK_PERCENT', cond: '> 90% on /', sev: 'CRIT', fired: 3, on: true },
    { id: 3, name: 'Agent disconnected', scope: 'all hosts', type: 'AGENT_DISCONNECTED', cond: '> 5 min', sev: 'CRIT', fired: 1, on: true },
    { id: 4, name: 'Pi-hole container down', scope: 'pihole-01', type: 'CONTAINER_DOWN', cond: 'pihole', sev: 'CRIT', fired: 0, on: true },
    { id: 5, name: 'eth0 error rate', scope: 'docker-01', type: 'NET_ERROR_RATE', cond: '> 10/s on eth0', sev: 'WARN', fired: 24, on: false },
  ];

  addRuleOpen = false;
  ruleType = 'CPU_PERCENT';
  ruleTypes = ['CPU_PERCENT', 'MEMORY_PERCENT', 'DISK_PERCENT', 'AGENT_DISCONNECTED', 'CONTAINER_DOWN', 'NET_ERROR_RATE', 'CUSTOM'];

  fieldMap: Record<string, { label: string; placeholder: string }[]> = {
    CPU_PERCENT: [{ label: 'Threshold %', placeholder: '90' }, { label: 'Consecutive checks', placeholder: '3' }],
    MEMORY_PERCENT: [{ label: 'Threshold %', placeholder: '85' }],
    DISK_PERCENT: [{ label: 'Threshold %', placeholder: '90' }, { label: 'Mount path (optional)', placeholder: '/ — all if blank' }],
    AGENT_DISCONNECTED: [{ label: 'Timeout (minutes)', placeholder: '5' }],
    CONTAINER_DOWN: [{ label: 'Container name or *', placeholder: 'pihole' }],
    NET_ERROR_RATE: [{ label: 'Errors/sec threshold', placeholder: '10' }, { label: 'Interface (optional)', placeholder: 'eth0' }],
    CUSTOM: [{ label: 'JSONPath expression', placeholder: '$.metrics.temp' }, { label: 'Value', placeholder: '80' }],
  };

  get ruleFields() { return this.fieldMap[this.ruleType] || []; }

  sevC: Record<string, { c: string; bg: string }> = {
    WARN: { c: C.warn, bg: 'rgba(251,191,36,0.12)' },
    CRIT: { c: C.crit, bg: 'rgba(248,113,113,0.12)' },
    INFO: { c: C.accentL, bg: 'rgba(168,85,247,0.12)' },
  };

  toggleRule(r: (typeof this.rules)[number]) { r.on = !r.on; }
  openAddRule() { this.addRuleOpen = true; }
  closeAddRule() { this.addRuleOpen = false; }
}
