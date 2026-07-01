import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  @ViewChild('restrictionFormPanel') restrictionFormPanel?: ElementRef<HTMLElement>;

  readonly role = this.auth.getRol();
  readonly isAdmin = this.role === 'admin';
  readonly minDate = new Date().toISOString().slice(0, 10);

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
  userSearchTerm = '';

  diagnosisForm = this.fb.group({
    date: [new Date().toISOString().slice(0, 10)],
    evaluator: [''],
    gender: [''],
    age: [null as number | null],
    height: [null as number | null, [Validators.required, Validators.min(0.5), Validators.max(2.5)]],
    weight: [null as number | null, [Validators.required, Validators.min(10), Validators.max(400)]],
    fatPercentage: [null as number | null],
    muscleMass: [null as number | null],
    observations: [''],
  });

  restrictionForm = this.fb.group({
    type: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]],
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
      // El token no incluye el ID: lo obtenemos desde el servidor con getMe()
      this.api.getMe().subscribe({
        next: user => {
          this.selectedUserId = user.idUser ?? null;
          if (this.selectedUserId) {
            this.loadDiagnoses();
          } else {
            this.error = 'No se pudo identificar el usuario autenticado. Por favor, cierra sesión e inicia de nuevo.';
          }
        },
        error: () => {
          this.error = 'No se pudo identificar el usuario autenticado. Por favor, cierra sesión e inicia de nuevo.';
        },
      });
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
        this.diagnoses = diagnoses.map(d => ({
          ...d,
          imc: typeof d.imc === 'number' ? Math.round(d.imc * 100) / 100 : d.imc
        }));
        this.selectedDiagnosis = this.diagnoses[0] || null;
        this.loading = false;
        if (this.selectedDiagnosis) this.loadRestrictions(this.selectedDiagnosis);
        this.loadAllRestrictions();
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

  calculatedImc: number | null = null;
  allRestrictions: MedicalRestrictionItem[] = [];
  showPreview: DiagnosisItem | null = null;
  previewRestrictions: MedicalRestrictionItem[] = [];

  calculateImc(): void {
    const h = Number(this.diagnosisForm.value.height);
    const w = Number(this.diagnosisForm.value.weight);
    if (h > 0 && w > 0) {
      this.calculatedImc = Math.round((w / (h * h)) * 100) / 100;
    } else {
      this.calculatedImc = null;
    }
  }

  openPreview(diagnosis: DiagnosisItem): void {
    this.showPreview = diagnosis;
    this.previewRestrictions = [];
    this.api.getRestrictionsByDiagnosis(diagnosis.idDiagnosis).subscribe({
      next: r => this.previewRestrictions = r,
      error: () => this.previewRestrictions = [],
    });
  }

  closePreview(): void {
    this.showPreview = null;
    this.previewRestrictions = [];
  }

  loadAllRestrictions(): void {
    if (!this.selectedUserId) return;
    this.api.getDiagnosesByUser(this.selectedUserId).subscribe({
      next: diags => {
        const calls = diags.map(d =>
          this.api.getRestrictionsByDiagnosis(d.idDiagnosis).toPromise().then(r => r || [])
        );
        Promise.all(calls).then(results => {
          this.allRestrictions = results.flat();
        });
      },
      error: () => { this.allRestrictions = []; },
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
    setTimeout(() => this.restrictionFormPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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

  filteredUsers(): UserProfile[] {
    const term = this.normalize(this.userSearchTerm);
    if (!term) return this.users;

    return this.users.filter(user => this.normalize([
      user.names,
      user.surnames,
      user.email,
      user.docNumber,
      user.docNum,
      user.phone,
    ].join(' ')).includes(term));
  }

  userLabel(user: UserProfile): string {
    const document = user.docNumber || user.docNum || user.email || 'sin documento';
    return `${user.names || ''} ${user.surnames || ''} - ${document}`.trim();
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
