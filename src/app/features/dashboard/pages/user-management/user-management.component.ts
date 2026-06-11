import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { UserProfile } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  users: UserProfile[] = [];
  selected: UserProfile | null = null;
  editing = false;
  loading = false;
  message = '';
  error = '';
  searchTerm = '';

  readonly form = this.fb.group({
    names: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
    surnames: [{ value: '', disabled: true }],
    docType: [{ value: '', disabled: true }],
    docNumber: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    phone: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }],
    state: [{ value: 'true', disabled: true }],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.message = '';
    this.error = '';

    this.api.getUsers().subscribe({
      next: users => {
        this.users = users;
        if (this.selected) {
          const refreshed = users.find(user => user.idUser === this.selected?.idUser);
          if (refreshed) this.selectUser(refreshed);
        }
        this.loading = false;
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo cargar la lista de usuarios.');
        this.loading = false;
      },
    });
  }

  selectUser(user: UserProfile): void {
    this.selected = user;
    this.editing = false;
    this.message = '';
    this.error = '';
    this.lockAdminControls();
    this.form.patchValue({
      names: user.names || '',
      surnames: user.surnames || '',
      docType: user.docType || '',
      docNumber: user.docNumber || user.docNum || '',
      email: user.email || '',
      phone: user.phone ? String(user.phone) : '',
      role: this.normalizedRole(user),
      state: String(user.state !== false),
    });
  }

  save(): void {
    if (!this.selected || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';
    const values = this.form.getRawValue();
    const currentRole = this.normalizedRole(this.selected);
    const requestedRole = values.role || currentRole;
    const currentState = this.selected.state !== false;
    const requestedState = values.state === 'true';

    const updateProfile$ = this.api.updateUser(this.selected.idUser, {
      names: values.names || '',
      surnames: values.surnames || '',
      docType: values.docType || '',
      docNumber: values.docNumber || '',
      email: values.email || '',
      phone: values.phone ? Number(values.phone) : undefined,
    });

    const updateRole$ = requestedRole !== currentRole
      ? this.api.updateUserRole(this.selected.idUser, requestedRole)
      : of(null);

    const updateState$ = requestedState !== currentState
      ? this.api.updateUserState(this.selected.idUser, requestedState)
      : of(null);

    forkJoin([updateProfile$, updateRole$, updateState$]).subscribe({
      next: ([profileResponse, roleResponse, stateResponse]) => {
        this.message = stateResponse?.message || roleResponse?.message || profileResponse.message || '';
        this.editing = false;
        this.loading = false;
        this.loadUsers();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudieron guardar los cambios.');
        this.loading = false;
      },
    });
  }

  roleName(user: UserProfile | null): string {
    const role = user?.role;
    if (!role) {
      return 'Sin rol';
    }
    return typeof role === 'string' ? role : role.name || 'Sin rol';
  }

  normalizedRole(user: UserProfile | null): string {
    return this.roleName(user).toLowerCase();
  }

  filteredUsers(): UserProfile[] {
    const term = this.normalize(this.searchTerm);
    if (!term) return this.users;

    return this.users.filter(user => {
      const state = user.state === false ? 'inactivo' : 'activo';
      const searchable = [
        user.names,
        user.surnames,
        user.email,
        user.docType,
        user.docNumber,
        user.docNum,
        user.phone,
        this.roleName(user),
        state,
      ].map(value => this.normalize(String(value || ''))).join(' ');

      return searchable.includes(term);
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  startEditing(): void {
    this.editing = true;
    this.unlockForm();
  }

  cancelEditing(): void {
    if (this.selected) {
      this.selectUser(this.selected);
    }
  }

  closeUserModal(): void {
    if (this.loading) return;
    this.selected = null;
    this.editing = false;
    this.lockAdminControls();
  }

  private lockAdminControls(): void {
    this.form.controls.names.disable();
    this.form.controls.surnames.disable();
    this.form.controls.docType.disable();
    this.form.controls.docNumber.disable();
    this.form.controls.email.disable();
    this.form.controls.phone.disable();
    this.form.controls.role.disable();
    this.form.controls.state.disable();
  }

  private unlockForm(): void {
    this.form.controls.names.enable();
    this.form.controls.surnames.enable();
    this.form.controls.docType.enable();
    this.form.controls.docNumber.enable();
    this.form.controls.email.enable();
    this.form.controls.phone.enable();
    this.form.controls.role.enable();
    this.form.controls.state.enable();
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
