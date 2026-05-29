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
        this.error = this.friendlyMessage(this.errorMessage(err), 'No se encontro el usuario.');
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
        this.error = this.friendlyMessage(this.errorMessage(err), 'No se pudo registrar la asistencia.');
        this.loading = false;
      },
    });
  }

  private errorMessage(err: any): string | undefined {
    return err?.error?.message || err?.error?.error;
  }

  private friendlyMessage(message: string | undefined, fallback: string): string {
    const text = (message || '').toLowerCase();
    if (!text) return fallback;
    if (text.includes('authorization') || text.includes('token') || text.includes('sesion') || text.includes('session')) {
      return 'Tu sesion no esta activa. Vuelve a iniciar sesion.';
    }
    if (text.includes('document') || text.includes('usuario')) {
      return 'No se encontro un usuario con ese documento.';
    }
    if (text.includes('blocked') || text.includes('sancion')) {
      return 'Acceso bloqueado por sancion activa.';
    }
    if (text.includes('entry') || text.includes('entrada')) {
      return 'Entrada registrada correctamente.';
    }
    if (text.includes('exit') || text.includes('salida')) {
      return 'Salida registrada correctamente.';
    }
    return message || fallback;
  }
}
