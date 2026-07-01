import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { AttendanceResult } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-manual-attendance',
  templateUrl: './manual-attendance.component.html',
  styleUrl: './manual-attendance.component.scss',
})
export class ManualAttendanceComponent {
  foundUser: AttendanceResult | null = null;
  message = '';
  error = '';
  loading = false;
  confirmMode = false;

  readonly form = this.fb.group({
    docNumber: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService) {}

  search(): void {
    const docNumber = this.form.value.docNumber || '';
    if (!docNumber) {
      this.form.get('docNumber')?.markAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    this.api.searchAttendanceUser(docNumber).subscribe({
      next: user => {
        this.foundUser = user;
        this.confirmMode = true;
        this.loading = false;
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se encontro el usuario.');
        this.loading = false;
      },
    });
  }

  register(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    this.message = '';
    this.api.registerManualAttendance(this.form.value.docNumber || '').subscribe({
      next: result => {
        this.message = result.message || 'Registro manual guardado.';
        this.loading = false;
        this.confirmMode = false;
        this.form.reset();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo registrar la asistencia.');
        this.loading = false;
      },
    });
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
