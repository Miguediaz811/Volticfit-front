import { Component, OnInit } from '@angular/core';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { AttendanceResult } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-attendance-history',
  templateUrl: './attendance-history.component.html',
  styleUrl: './attendance-history.component.scss',
})
export class AttendanceHistoryComponent implements OnInit {
  records: AttendanceResult[] = [];
  page = 0;
  totalPages = 0;
  loading = false;
  error = '';

  constructor(private api: DashboardApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page): void {
    this.loading = true;
    this.error = '';
    this.api.getAttendanceHistory(page).subscribe({
      next: response => {
        this.records = response.content;
        this.page = response.number;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: err => {
        this.records = [];
        this.error = err.status === 404 ? '' : 'No se pudo cargar el historial.';
        this.loading = false;
      },
    });
  }
}
