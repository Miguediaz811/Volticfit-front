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
  selectedMetric: 'weight' | 'bmi' | 'fat' | 'muscle' = 'weight';

  constructor(private api: DashboardApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getProgress().subscribe({
      next: progress => {
        if (progress && progress.bmiHistory) {
          progress.bmiHistory = progress.bmiHistory.map(item => ({
            ...item,
            value: typeof item.value === 'number' ? Math.round(item.value * 100) / 100 : item.value
          }));
        }
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

  metricOptions(): Array<{ key: 'weight' | 'bmi' | 'fat' | 'muscle'; label: string; items: ProgressMetricItem[]; unit: string }> {
    return [
      { key: 'weight', label: 'Peso', items: this.progress?.weightHistory || [], unit: 'kg' },
      { key: 'bmi', label: 'IMC', items: this.progress?.bmiHistory || [], unit: '' },
      { key: 'fat', label: 'Grasa', items: this.progress?.fatPercentageHistory || [], unit: '%' },
      { key: 'muscle', label: 'Masa muscular', items: this.progress?.muscleMassHistory || [], unit: 'kg' },
    ];
  }

  selectedSeries(): ProgressMetricItem[] {
    return this.metricOptions().find(option => option.key === this.selectedMetric)?.items || [];
  }

  selectedUnit(): string {
    return this.metricOptions().find(option => option.key === this.selectedMetric)?.unit || '';
  }

  chartPoints(): string {
    const items = this.selectedSeries();
    if (items.length === 0) return '';

    const width = 640;
    const height = 220;
    const padding = 26;
    const values = items.map(item => Number(item.value) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return items.map((item, index) => {
      const x = items.length === 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / (items.length - 1);
      const y = height - padding - (((Number(item.value) || 0) - min) * (height - padding * 2)) / range;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  chartValue(item: ProgressMetricItem): string {
    const unit = this.selectedUnit();
    return `${item.value}${unit ? ' ' + unit : ''}`;
  }
}
