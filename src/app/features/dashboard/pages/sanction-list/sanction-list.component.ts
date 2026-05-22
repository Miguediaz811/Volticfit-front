import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { Sanction } from '../../../../shared/interfaces/sanction';
import { AuthService } from '../../../../core/services/auth.service';
import { UserProfile } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-sanction-list',
  templateUrl: './sanction-list.component.html',
  styleUrl: './sanction-list.component.scss',
})
export class SanctionListComponent implements OnInit {
  sanctions: Sanction[] = [];
  users: UserProfile[] = [];
  selected: Sanction | null = null;
  loading = false;
  saving = false;
  message = '';
  error = '';
  readonly isAdmin = this.auth.getRol() === 'admin';

  readonly form = this.fb.group({
    userId: ['', [Validators.required]],
    type: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    startDate: [new Date().toISOString().slice(0, 10), [Validators.required]],
    endDate: [new Date().toISOString().slice(0, 10), [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private api: DashboardApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
    if (this.isAdmin) {
      this.loadUsers();
    }
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getSanctions().subscribe({
      next: sanctions => {
        this.sanctions = sanctions;
        this.loading = false;
      },
      error: err => {
        this.sanctions = [];
        this.error = err.status === 404 ? '' : 'No se pudieron cargar las sanciones.';
        this.loading = false;
      },
    });
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: users => { this.users = users; },
      error: () => { this.users = []; },
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';
    const values = this.form.getRawValue();

    this.api.createSanction({
      userId: Number(values.userId),
      type: values.type || '',
      description: values.description || '',
      startDate: values.startDate || '',
      endDate: values.endDate || '',
    }).subscribe({
      next: response => {
        this.message = response.message || 'Sancion registrada correctamente.';
        this.saving = false;
        this.form.reset({
          userId: '',
          type: '',
          description: '',
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
        });
        this.load();
      },
      error: err => {
        this.error = this.friendlyMessage(err.error?.message, 'No se pudo registrar la sancion.');
        this.saving = false;
      },
    });
  }

  userLabel(user: UserProfile): string {
    const document = user.docNumber || user.docNum || 'sin documento';
    return `${user.names} ${user.surnames || ''} - ${document}`.trim();
  }

  private friendlyMessage(message: string | undefined, fallback: string): string {
    const text = (message || '').toLowerCase();
    if (!text) return fallback;
    if (text.includes('usuario') || text.includes('user')) {
      return 'Selecciona un usuario valido.';
    }
    if (text.includes('descripcion') || text.includes('description')) {
      return 'Escribe una descripcion para la sancion.';
    }
    if (text.includes('fecha') || text.includes('date')) {
      return 'Revisa las fechas de la sancion.';
    }
    return message || fallback;
  }
}
