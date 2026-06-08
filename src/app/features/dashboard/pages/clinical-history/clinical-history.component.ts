import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { ClinicalHistoryItem, UserProfile } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-clinical-history',
  templateUrl: './clinical-history.component.html',
  styleUrl: './clinical-history.component.scss',
})
export class ClinicalHistoryComponent implements OnInit {
  readonly role = this.auth.getRol();
  readonly isAdmin = this.role === 'admin';

  users: UserProfile[] = [];
  selectedUserId: number | null = null;
  history: ClinicalHistoryItem[] = [];
  editingEntry: ClinicalHistoryItem | null = null;
  loading = false;
  saving = false;
  message = '';
  error = '';
  userSearchTerm = '';
  form = this.fb.group({
    date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private api: DashboardApiService,
  ) {}

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadUsers();
      return;
    }

    this.loadHistory();
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.selectedUserId = users[0]?.idUser ?? null;
        this.loadHistory();
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo cargar la lista de usuarios.'),
    });
  }

  loadHistory(): void {
    this.loading = true;
    this.error = '';

    this.api.getClinicalHistory(this.targetUserId()).subscribe({
      next: history => {
        this.history = history;
        this.loading = false;
      },
      error: err => {
        this.history = [];
        this.loading = false;
        if (err?.status !== 404) {
          this.error = this.serverMessage(err, 'No se pudo cargar la historia clínica.');
        }
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

    const payload = {
      date: this.form.value.date || '',
      description: this.form.value.description || '',
    };
    const request$ = this.editingEntry
      ? this.api.updateClinicalHistory(this.editingEntry.idHistory, payload)
      : this.api.createClinicalHistory(payload, this.targetUserId());

    request$.subscribe({
      next: response => {
        this.message = response.message || 'Registro clínico guardado correctamente.';
        this.cancelEdit();
        this.saving = false;
        this.loadHistory();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo guardar el registro clínico.');
        this.saving = false;
      },
    });
  }

  editEntry(entry: ClinicalHistoryItem): void {
    this.editingEntry = entry;
    this.form.patchValue({
      date: entry.date || new Date().toISOString().slice(0, 10),
      description: entry.description || '',
    });
  }

  cancelEdit(): void {
    this.editingEntry = null;
    this.form.reset({
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  deleteEntry(entry: ClinicalHistoryItem): void {
    this.error = '';
    this.message = '';

    this.api.deleteClinicalHistory(entry.idHistory).subscribe({
      next: response => {
        this.message = response.message || 'Registro clínico eliminado correctamente.';
        if (this.editingEntry?.idHistory === entry.idHistory) {
          this.cancelEdit();
        }
        this.loadHistory();
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo eliminar el registro clínico.'),
    });
  }

  onUserChange(): void {
    this.cancelEdit();
    this.loadHistory();
  }

  selectUserForHistory(user: UserProfile): void {
    this.selectedUserId = user.idUser;
    this.userSearchTerm = '';
    this.onUserChange();
  }

  filteredUsers(): UserProfile[] {
    if (!this.userSearchTerm.trim()) return [];
    const term = this.normalize(this.userSearchTerm);
    return this.users.filter(u =>
      this.normalize(u.names).includes(term) ||
      this.normalize(u.surnames || '').includes(term) ||
      this.normalize(u.email).includes(term)
    );
  }

  userLabel(user: UserProfile): string {
    return `${user.names} ${user.surnames || ''} - ${user.email}`;
  }

  private normalize(text: string): string {
    return text.toLowerCase().trim();
  }

  private targetUserId(): number | undefined {
    return this.isAdmin && this.selectedUserId ? this.selectedUserId : undefined;
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}