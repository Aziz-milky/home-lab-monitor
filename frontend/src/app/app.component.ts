import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ServiceApiService } from './services/service-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatSnackBarModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Sentinel';
  private api = inject(ServiceApiService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  refresh(): void {
    window.location.reload();
  }

  searchService(query: string): void {
    if (!query.trim()) return;
    this.api.getAll(0, 100).subscribe({
      next: (page) => {
        const match = page.content.find(s =>
          s.name.toLowerCase().includes(query.toLowerCase())
        );
        if (match) {
          this.router.navigate(['/services', match.id]);
        } else {
          this.snackBar.open(`No service matching "${query}"`, 'Close', { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Search failed', 'Close', { duration: 3000 });
      }
    });
  }
}
