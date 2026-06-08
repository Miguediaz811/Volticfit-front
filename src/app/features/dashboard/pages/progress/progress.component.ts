import { Component, OnInit } from '@angular/core';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { ProgressMetricItem, ProgressResponse } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
})
export class ProgressComponent implements OnInit {
  progress: ProgressResponse | null = null;
  loading = false;
  error = '';

  constructor(private api: DashboardApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getProgress().subscribe({
      next: progress => {
        this.progress = progress;
        this.loading = false;
      },
      error: err => {
        this.progress = null;
        this.loading = false;
        if (err?.status !== 204) {
          this.error = err?.error?.message || err?.message || 'No se pudo cargar tu progreso.';
        }
      },
    });
  }

  latest(items?: ProgressMetricItem[]): string {
    if (!items?.length) return '-';
    return String(items[items.length - 1].value);
  }

  valueAt(items: ProgressMetricItem[], index: number): string {
    return items[index] ? String(items[index].value) : '-';
  }

  hasData(): boolean {
    return !!this.progress && [
      this.progress.weightHistory,
      this.progress.bmiHistory,
      this.progress.fatPercentageHistory,
      this.progress.muscleMassHistory,
    ].some(items => items.length > 0);
  }
}
