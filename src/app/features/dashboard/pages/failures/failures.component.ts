import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { FailureReportItem, MachineItem } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-failures',
  templateUrl: './failures.component.html',
  styleUrl: './failures.component.scss',
})
export class FailuresComponent implements OnInit {
  machines: MachineItem[] = [];
  reports: FailureReportItem[] = [];
  loading = false;
  saving = false;
  message = '';
  error = '';
  readonly isAdmin = this.auth.getRol() === 'admin';
  readonly descriptionMaxLength = 250;

  form = this.fb.group({
    machineId: ['', [Validators.required]],
    priority: ['Media', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(250)]],
  });

  constructor(
    private fb: FormBuilder,
    private api: DashboardApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadMachines();
    if (this.isAdmin) {
      this.loadReports();
    }
  }

  loadMachines(): void {
    this.error = '';
    this.api.getMachines().subscribe({
      next: machines => {
        const normalize = (s: string) =>
          s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
        this.machines = machines.filter(m => !normalize(m.name || '').startsWith('sinmaquina'));
      },
      error: err => { this.error = this.serverMessage(err, 'No se pudieron cargar los equipos. Verifica tu conexión con el servidor.'); },
    });
  }

  loadReports(): void {
    this.loading = true;
    this.error = '';
    this.api.getFailureReports().subscribe({
      next: reports => {
        this.reports = reports;
        this.loading = false;
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo cargar el historial de fallas.');
        this.loading = false;
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';

    this.api.createFailureReport({
      machineId: Number(this.form.value.machineId),
      priority: this.form.value.priority || 'Media',
      description: this.form.value.description || '',
    }).subscribe({
      next: report => {
        this.message = `Falla reportada correctamente. Codigo: ${report.code}`;
        this.form.reset({ machineId: '', priority: 'Media', description: '' });
        this.saving = false;
        if (this.isAdmin) this.loadReports();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo reportar la falla.');
        this.saving = false;
      },
    });
  }

  selectedReport: FailureReportItem | null = null;

  openDetail(report: FailureReportItem): void {
    this.selectedReport = report;
  }

  closeDetail(): void {
    this.selectedReport = null;
  }

  markInReview(report: FailureReportItem): void {
    this.updateStatus(report, 'En revision');
  }

  resolve(report: FailureReportItem): void {
    this.updateStatus(report, 'Resuelta');
  }

  private updateStatus(report: FailureReportItem, status: FailureReportItem['status']): void {
    this.api.updateFailureStatus(report.code, status).subscribe({
      next: response => {
        this.message = response.message || 'Estado actualizado.';
        this.loadReports();
      },
      error: err => { this.error = this.serverMessage(err, 'No se pudo actualizar la falla.'); },
    });
  }

  private serverMessage(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }
}
