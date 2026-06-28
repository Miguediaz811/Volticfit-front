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
  documentsByHistory: Record<number, any[]> = {};
  selectedFiles: Record<number, File | null> = {};
  formDocumentFile: File | null = null;
  editingEntry: ClinicalHistoryItem | null = null;
  loading = false;
  saving = false;
  message = '';
  error = '';
  userSearchTerm = '';
  readonly descriptionMaxLength = 100;
  form = this.fb.group({
    date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
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
        history.forEach(entry => this.loadDocuments(entry.idHistory));
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
    const editingId = this.editingEntry?.idHistory;
    const request$ = editingId
      ? this.api.updateClinicalHistory(editingId, payload)
      : this.api.createClinicalHistory(payload, this.targetUserId());

    request$.subscribe({
      next: response => {
        const historyId = editingId || response.id || response.idHistory;
        if (this.formDocumentFile && historyId) {
          this.api.uploadClinicalHistoryDocument(historyId, this.formDocumentFile).subscribe({
            next: uploadResponse => {
              this.message = uploadResponse.message || response.message || 'Registro clinico y documento guardados correctamente.';
              this.finishSave();
            },
            error: err => {
              this.error = this.serverMessage(err, 'El registro se guardo, pero no se pudo subir el documento.');
              this.finishSave(false);
            },
          });
          return;
        }

        this.message = response.message || 'Registro clinico guardado correctamente.';
        this.finishSave();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo guardar el registro clinico.');
        this.saving = false;
      },
    });
  }

  showEditModal = false;

  editEntry(entry: ClinicalHistoryItem): void {
    this.editingEntry = entry;
    this.showEditModal = true;
    this.form.patchValue({
      date: entry.date || new Date().toISOString().slice(0, 10),
      description: entry.description || '',
    });
  }

  cancelEdit(): void {
    this.editingEntry = null;
    this.showEditModal = false;
    this.form.reset({
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
    this.formDocumentFile = null;
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onFormFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formDocumentFile = input.files?.[0] || null;
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

  onFileSelected(entry: ClinicalHistoryItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles[entry.idHistory] = input.files?.[0] || null;
  }

  uploadDocument(entry: ClinicalHistoryItem): void {
    const file = this.selectedFiles[entry.idHistory];
    if (!file) {
      this.error = 'Selecciona un archivo PDF o Word antes de subirlo.';
      return;
    }

    this.message = '';
    this.error = '';
    this.api.uploadClinicalHistoryDocument(entry.idHistory, file).subscribe({
      next: response => {
        this.message = response.message || 'Documento subido correctamente.';
        this.selectedFiles[entry.idHistory] = null;
        this.loadDocuments(entry.idHistory);
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo subir el documento.'),
    });
  }

  loadDocuments(historyId: number): void {
    this.api.getClinicalHistoryDocuments(historyId).subscribe({
      next: docs => { this.documentsByHistory[historyId] = docs; },
      error: () => { this.documentsByHistory[historyId] = []; },
    });
  }

  downloadDocument(entry: ClinicalHistoryItem, doc: any): void {
    this.api.downloadClinicalHistoryDocument(entry.idHistory, doc.idDocument).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName || 'historial-clinico';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo descargar el documento.'),
    });
  }

  deleteDocument(entry: ClinicalHistoryItem, doc: any): void {
    this.api.deleteClinicalHistoryDocument(entry.idHistory, doc.idDocument).subscribe({
      next: response => {
        this.message = response.message || 'Documento eliminado correctamente.';
        this.loadDocuments(entry.idHistory);
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo eliminar el documento.'),
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

  private finishSave(clearForm = true): void {
    if (clearForm) {
      this.cancelEdit();
    } else {
      this.formDocumentFile = null;
    }
    this.saving = false;
    this.loadHistory();
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
