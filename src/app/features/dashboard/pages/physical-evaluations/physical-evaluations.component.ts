import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  InstructorAvailability,
  PhysicalEvaluationItem,
} from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-physical-evaluations',
  templateUrl: './physical-evaluations.component.html',
  styleUrl: './physical-evaluations.component.scss',
})
export class PhysicalEvaluationsComponent implements OnInit {
  availability: InstructorAvailability[] = [];
  evaluations: PhysicalEvaluationItem[] = [];
  selectedSlot: InstructorAvailability | null = null;
  rescheduling: PhysicalEvaluationItem | null = null;
  loadingAvailability = false;
  loadingEvaluations = false;
  saving = false;
  message = '';
  error = '';
  readonly minDate = new Date().toISOString().slice(0, 10);
  readonly isAdmin: boolean;

  form = this.fb.group({
    date: [this.minDate, [Validators.required]],
    notes: [''],
  });

  constructor(
    private fb: FormBuilder,
    private api: DashboardApiService,
    private auth: AuthService,
  ) {
    this.isAdmin = this.auth.getRol() === 'admin';
  }

  ngOnInit(): void {
    this.loadAvailability();
    this.loadEvaluations();
  }

  loadAvailability(): void {
    const date = this.form.value.date;
    if (!date) return;
    if (date < this.minDate) {
      this.form.patchValue({ date: this.minDate });
      this.error = 'Selecciona una fecha desde hoy en adelante.';
      this.availability = [];
      return;
    }

    this.loadingAvailability = true;
    this.error = '';
    this.selectedSlot = null;

    this.api.getEvaluationAvailability(date).subscribe({
      next: availability => {
        this.availability = availability;
        this.loadingAvailability = false;
      },
      error: err => {
        this.availability = [];
        this.loadingAvailability = false;
        if (err?.status !== 404) {
          this.error = this.serverMessage(err, 'No se pudo cargar la disponibilidad.');
        }
      },
    });
  }

  loadEvaluations(): void {
    this.loadingEvaluations = true;

    const request$ = this.isAdmin
      ? this.api.getAllEvaluations()
      : this.api.getMyEvaluations();

    request$.subscribe({
      next: evaluations => {
        this.evaluations = evaluations;
        this.loadingEvaluations = false;
      },
      error: err => {
        this.evaluations = [];
        this.loadingEvaluations = false;
        if (err?.status !== 404) {
          this.error = this.serverMessage(err, 'No se pudieron cargar las evaluaciones.');
        }
      },
    });
  }

  selectSlot(slot: InstructorAvailability): void {
    if (!slot.available) return;
    this.selectedSlot = slot;
  }

  save(): void {
    if (this.form.invalid || !this.selectedSlot) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';

    const payload = {
      date: this.form.value.date || '',
      startTime: this.selectedSlot.startTime,
      instructorId: this.selectedSlot.instructorId,
      notes: this.form.value.notes || undefined,
    };

    const request$ = this.rescheduling
      ? this.api.rescheduleEvaluation(this.evaluationId(this.rescheduling), payload)
      : this.api.createEvaluation(payload);

    request$.subscribe({
      next: response => {
        this.message = response.message || (this.rescheduling ? 'Evaluación reprogramada correctamente.' : 'Evaluación agendada correctamente.');
        this.saving = false;
        this.rescheduling = null;
        this.selectedSlot = null;
        this.form.patchValue({ notes: '' });
        this.loadAvailability();
        this.loadEvaluations();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo guardar la evaluación.');
        this.saving = false;
      },
    });
  }

  startReschedule(evaluation: PhysicalEvaluationItem): void {
    this.rescheduling = evaluation;
    this.form.patchValue({
      date: evaluation.date,
      notes: evaluation.notes || '',
    });
    this.loadAvailability();
  }

  cancelReschedule(): void {
    this.rescheduling = null;
    this.selectedSlot = null;
    this.form.patchValue({ notes: '' });
  }

  cancelEvaluation(evaluation: PhysicalEvaluationItem): void {
    this.message = '';
    this.error = '';

    this.api.cancelEvaluation(this.evaluationId(evaluation)).subscribe({
      next: response => {
        this.message = response.message || 'Evaluación cancelada correctamente.';
        this.loadAvailability();
        this.loadEvaluations();
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo cancelar la evaluación.'),
    });
  }

  evaluationId(evaluation: PhysicalEvaluationItem): number {
    return Number(evaluation.idEvaluation ?? evaluation.IdEvaluation);
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    if (typeof message === 'string' && message.includes('Validation failed')) {
      return 'Selecciona una fecha, un horario y un instructor disponible antes de agendar.';
    }

    return message || fallback;
  }
}