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
  editingSanction: Sanction | null = null;
  showFormModal = false;
  loading = false;
  saving = false;
  message = '';
  error = '';
  formError = '';
  readonly isAdmin = this.auth.getRol() === 'admin';

  readonly form = this.fb.group({
    userId: [''],
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
        this.error = err.status === 404 ? '' : this.serverMessage(err, 'No se pudieron cargar las sanciones.');
        this.loading = false;
      },
    });
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: users => { this.users = users.filter(user => !this.isAdminUser(user)); },
      error: () => { this.users = []; },
    });
  }

  saveSanction(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Completa todos los campos de la sanción antes de guardar.';
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';
    this.formError = '';
    const values = this.form.getRawValue();

    if ((values.endDate || '') < (values.startDate || '')) {
      this.formError = 'La fecha final no puede ser anterior a la fecha inicial.';
      this.saving = false;
      return;
    }

    const payload = {
      type: values.type || '',
      description: values.description || '',
      startDate: values.startDate || '',
      endDate: values.endDate || '',
    };
    const userId = Number(values.userId);

    if (!this.editingSanction && (!Number.isFinite(userId) || userId <= 0)) {
      this.formError = 'Selecciona un usuario válido.';
      this.saving = false;
      return;
    }

    const request$ = this.editingSanction
      ? this.api.updateSanction(this.editingSanction.idSanction, payload)
      : this.api.createSanction({ ...payload, userId });

    request$.subscribe({
      next: response => {
        this.message = response.message || (this.editingSanction ? 'Sanción actualizada correctamente.' : 'Sanción registrada correctamente.');
        this.saving = false;
        this.closeFormModal();
        this.load();
      },
      error: err => {
        this.formError = this.serverMessage(err, this.editingSanction ? 'No se pudo actualizar la sanción.' : 'No se pudo registrar la sanción.');
        this.saving = false;
      },
    });
  }

  openCreateModal(): void {
    this.message = '';
    this.error = '';
    this.formError = '';
    this.editingSanction = null;
    this.form.reset({
      userId: '',
      type: '',
      description: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
    });
    this.showFormModal = true;
    if (this.users.length === 0) {
      this.loadUsers();
    }
  }

  openEditModal(sanction: Sanction): void {
    this.message = '';
    this.error = '';
    this.formError = '';
    this.editingSanction = sanction;
    this.form.reset({
      userId: sanction.user?.idUser ? String(sanction.user.idUser) : '',
      type: sanction.type || '',
      description: sanction.description || '',
      startDate: sanction.startDate || new Date().toISOString().slice(0, 10),
      endDate: sanction.endDate || new Date().toISOString().slice(0, 10),
    });
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.saving) return;
    this.showFormModal = false;
    this.editingSanction = null;
    this.formError = '';
  }

  deleteSanction(sanction: Sanction): void {
    this.message = '';
    this.error = '';

    this.api.deleteSanction(sanction.idSanction).subscribe({
      next: response => {
        this.message = response.message || 'Sanción desactivada correctamente.';
        if (this.selected?.idSanction === sanction.idSanction) {
          this.selected = null;
        }
        this.load();
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo desactivar la sanción.'),
    });
  }

  openDetailModal(sanction: Sanction): void {
    this.selected = sanction;
  }

  closeDetailModal(): void {
    this.selected = null;
  }

  userLabel(user: UserProfile): string {
    const document = user.docNumber || user.docNum || 'sin documento';
    return `${user.names} ${user.surnames || ''} - ${document}`.trim();
  }

  private isAdminUser(user: UserProfile): boolean {
    const role = typeof user.role === 'string' ? user.role : user.role?.name;
    return (role || '').toLowerCase().replace(/^role_/, '') === 'admin';
  }

  sanctionUserLabel(sanction: Sanction): string {
    if (!sanction.user) return 'Sin usuario';
    const document = sanction.user.docNumber || sanction.user.docNum || 'sin documento';
    return `${sanction.user.names || ''} ${sanction.user.surnames || ''} - ${document}`.trim();
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
