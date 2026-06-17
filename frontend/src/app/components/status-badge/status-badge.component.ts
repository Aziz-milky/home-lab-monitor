import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="status.toLowerCase()">
      <span class="dot"></span>
      {{ status }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 10px;
      border-radius: 100px;
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .up {
      background: rgba(41, 182, 246, 0.12);
      color: #4fc3f7;
    }
    .up .dot { background: #4fc3f7; }
    .down {
      background: rgba(92, 107, 192, 0.15);
      color: #7986cb;
    }
    .down .dot { background: #7986cb; }
    .unknown {
      background: rgba(144, 164, 174, 0.1);
      color: #78909c;
    }
    .unknown .dot { background: #78909c; }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: string;
}
