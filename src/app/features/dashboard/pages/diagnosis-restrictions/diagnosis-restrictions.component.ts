import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import {
  DiagnosisItem,
  MedicalRestrictionItem,
  UserProfile,
} from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-diagnosis-restrictions',
  templateUrl: './diagnosis-restrictions.component.html',
  styleUrl: './diagnosis-restrictions.component.scss',
})
export class DiagnosisRestrictionsComponent implements OnInit {
  readonly role = this.auth.getRol();
  readonly isAdmin = this.role === 'admin';

  users: UserProfile[] = [];
  selectedUserId: number | null = null;
  diagnoses: DiagnosisItem[] = [];
  selectedDiagnosis: DiagnosisItem | null = null;
  restrictions: MedicalRestrictionItem[] = [];
  editingRestriction: MedicalRestrictionItem | null = null;
  loading = false;
  savingDiagnosis = false;
  savingRestriction = false;
  message = '';
  error = '';

  diagnosisForm = this.fb.group({
    date: [new Date().toISOString().slice(0, 10)],
    evaluator: [''],
    gender: [''],
    age: [null as number | null],
    height: [null as number | null, [Validators.required, Validators.min(0.1)]],
    weight: [null as number | null, [Validators.required, Validators.min(1)]],
    fatPercentage: [null as number | null],
    muscleMass: [null as number | null],
    observations: [''],
  });

  restrictionForm = this.fb.group({
    type: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(4)]],
    startDate: [''],
    endDate: [''],
    state: [true],
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

    this.selectedUserId = this.auth.getUserId();
    if (this.selectedUserId) {
      this.loadDiagnoses();
    } else {
      this.error = 'No se pudo identificar el usuario autenticado.';
    }
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.selectedUserId = users[0]?.idUser ?? null;
        if (this.selectedUserId) this.loadDiagnoses();
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo cargar la lista de usuarios.'),
    });
  }

  loadDiagnoses(): void {
    if (!this.selectedUserId) return;

    this.loading = true;
    this.error = '';
    this.selectedDiagnosis = null;
    this.restrictions = [];

    this.api.getDiagnosesByUser(this.selectedUserId).subscribe({
      next: diagnoses => {
        this.diagnoses = diagnoses;
        this.selectedDiagnosis = diagnoses[0] || null;
        this.loading = false;
        if (this.selectedDiagnosis) this.loadRestrictions(this.selectedDiagnosis);
      },
      error: err => {
        this.diagnoses = [];
        this.loading = false;
        if (err?.status !== 404) {
          this.error = this.serverMessage(err, 'No se pudieron cargar los diagnósticos.');
        }
      },
    });
  }

  loadRestrictions(diagnosis: DiagnosisItem): void {
    this.selectedDiagnosis = diagnosis;
    this.restrictions = [];
    this.error = '';

    this.api.getRestrictionsByDiagnosis(diagnosis.idDiagnosis).subscribe({
      next: restrictions => this.restrictions = restrictions,
      error: err => {
        this.restrictions = [];
        if (err?.status !== 404) {
          this.error = this.serverMessage(err, 'No se pudieron cargar las restricciones.');
        }
      },
    });
  }

  saveDiagnosis(): void {
    if (!this.selectedUserId || this.diagnosisForm.invalid) {
      this.diagnosisForm.markAllAsTouched();
      return;
    }

    const value = this.diagnosisForm.value;
    this.savingDiagnosis = true;
    this.message = '';
    this.error = '';

    this.api.createDiagnosis({
      userId: this.selectedUserId,
      evaluator: value.evaluator || undefined,
      observations: value.observations || undefined,
      fatPercentage: value.fatPercentage || undefined,
      muscleMass: value.muscleMass || undefined,
      height: Number(value.height),
      weight: Number(value.weight),
      gender: value.gender || undefined,
      age: value.age || undefined,
      date: value.date || undefined,
    }).subscribe({
      next: response => {
        this.message = response.message || 'Diagnóstico guardado correctamente.';
        this.savingDiagnosis = false;
        this.loadDiagnoses();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo guardar el diagnóstico.');
        this.savingDiagnosis = false;
      },
    });
  }

  saveRestriction(): void {
    if (!this.selectedDiagnosis || this.restrictionForm.invalid) {
      this.restrictionForm.markAllAsTouched();
      return;
    }

    const value = this.restrictionForm.value;
    this.savingRestriction = true;
    this.message = '';
    this.error = '';

    const payload = {
      diagnosisId: this.selectedDiagnosis.idDiagnosis,
      type: value.type || '',
      description: value.description || '',
      startDate: value.startDate || undefined,
      endDate: value.endDate || undefined,
      state: value.state ?? true,
    };

    const request$ = this.editingRestriction
      ? this.api.updateRestriction(this.editingRestriction.idRestriction, payload)
      : this.api.createRestriction(payload);

    request$.subscribe({
      next: response => {
        this.message = response.message || 'Restricción guardada correctamente.';
        this.savingRestriction = false;
        this.cancelRestrictionEdit();
        this.loadRestrictions(this.selectedDiagnosis!);
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo guardar la restricción.');
        this.savingRestriction = false;
      },
    });
  }

  editRestriction(restriction: MedicalRestrictionItem): void {
    this.editingRestriction = restriction;
    this.restrictionForm.patchValue({
      type: restriction.type || '',
      description: restriction.description || '',
      startDate: restriction.startDate || '',
      endDate: restriction.endDate || '',
      state: restriction.state !== false,
    });
  }

  cancelRestrictionEdit(): void {
    this.editingRestriction = null;
    this.restrictionForm.reset({ type: '', description: '', startDate: '', endDate: '', state: true });
  }

  deleteDiagnosis(diagnosis: DiagnosisItem): void {
    this.message = '';
    this.error = '';

    this.api.deleteDiagnosis(diagnosis.idDiagnosis).subscribe({
      next: response => {
        this.message = response.message || 'Diagnóstico eliminado correctamente.';
        if (this.selectedDiagnosis?.idDiagnosis === diagnosis.idDiagnosis) {
          this.selectedDiagnosis = null;
          this.restrictions = [];
          this.cancelRestrictionEdit();
        }
        this.loadDiagnoses();
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo eliminar el diagnóstico.'),
    });
  }

  deleteRestriction(restriction: MedicalRestrictionItem): void {
    this.message = '';
    this.error = '';

    this.api.deleteRestriction(restriction.idRestriction).subscribe({
      next: response => {
        this.message = response.message || 'Restricción eliminada correctamente.';
        if (this.selectedDiagnosis) this.loadRestrictions(this.selectedDiagnosis);
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo eliminar la restricción.'),
    });
  }

  onUserChange(): void {
    this.loadDiagnoses();
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
