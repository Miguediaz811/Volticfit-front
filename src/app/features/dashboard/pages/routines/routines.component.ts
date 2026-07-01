import { Component, OnInit } from '@angular/core';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { RoutineHistoryItem, RoutineResponse } from '../../../../shared/interfaces/dashboard.interface';

const ROUTINE_DAYS = 28;

@Component({
  selector: 'app-routines',
  templateUrl: './routines.component.html',
  styleUrl: './routines.component.scss',
})
export class RoutinesComponent implements OnInit {
  activeRoutine: RoutineResponse | null = null;
  activeAssignmentDate: string | null = null;
  history: RoutineHistoryItem[] = [];
  loadingActive = false;
  loadingHistory = false;
  generating = false;
  generatingCooldown = false;
  completing = false;
  message = '';
  error = '';

  constructor(private api: DashboardApiService) {}

  ngOnInit(): void {
    this.loadActiveRoutine();
    this.loadHistory();
  }

  loadActiveRoutine(): void {
    this.loadingActive = true;
    this.error = '';

    this.api.getActiveRoutine().subscribe({
      next: routine => {
        this.activeRoutine = routine;
        this.loadingActive = false;
        this.syncAssignmentDate();
      },
      error: err => {
        this.activeRoutine = null;
        this.activeAssignmentDate = null;
        this.loadingActive = false;
        if (err?.status !== 404) {
          this.error = this.serverMessage(err, 'No se pudo cargar la rutina activa.');
        }
      },
    });
  }

  loadHistory(): void {
    this.loadingHistory = true;

    this.api.getRoutineHistory().subscribe({
      next: history => {
        this.history = history;
        this.loadingHistory = false;
        this.syncAssignmentDate();
      },
      error: err => {
        this.history = [];
        this.loadingHistory = false;
        if (err?.status !== 404) {
          this.error = this.serverMessage(err, 'No se pudo cargar el historial de rutinas.');
        }
      },
    });
  }

  /** Sincroniza la fecha de asignación de la rutina activa desde el historial */
  private syncAssignmentDate(): void {
    if (!this.activeRoutine || !this.history.length) return;
    const active = this.history.find(h => h.state === true || h.active === true);
    if (active?.assignmentDate) {
      this.activeAssignmentDate = active.assignmentDate;
    }
  }

  /** Días transcurridos desde que se asignó la rutina (máx 28) */
  daysElapsed(): number {
    if (!this.activeAssignmentDate) return 0;
    const start = new Date(this.activeAssignmentDate);
    const today = new Date();
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(diff, ROUTINE_DAYS);
  }

  /** Días restantes para completar los 28 días */
  daysRemaining(): number {
    return Math.max(0, ROUTINE_DAYS - this.daysElapsed());
  }

  /** Offset SVG del anillo de progreso (circunferencia = 2π×24 ≈ 150.8) */
  dayCounterOffset(): number {
    const circumference = 2 * Math.PI * 24;
    const progress = this.daysElapsed() / ROUTINE_DAYS;
    return circumference * (1 - progress);
  }

  generateRoutine(): void {
    this.generating = true;
    this.message = '';
    this.error = '';

    this.api.generateRoutine().subscribe({
      next: routine => {
        this.activeRoutine = routine;
        this.activeAssignmentDate = new Date().toISOString().split('T')[0];
        this.message = 'Rutina generada correctamente.';
        this.generating = false;
        this.generatingCooldown = false;
        this.loadHistory();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo generar la rutina.');
        this.generating = false;
        this.generatingCooldown = true;
        setTimeout(() => this.generatingCooldown = false, 10000);
      },
    });
  }

  completeRoutine(): void {
    if (!this.activeRoutine?.routineId) return;

    this.completing = true;
    this.message = '';
    this.error = '';

    this.api.completeRoutine(this.activeRoutine.routineId).subscribe({
      next: response => {
        this.message = response.message || 'Rutina completada correctamente.';
        this.completing = false;
        this.activeAssignmentDate = null;
        this.loadActiveRoutine();
        this.loadHistory();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo completar la rutina.');
        this.completing = false;
      },
    });
  }

  /** Puede generar rutina: si no hay activa, o si ya pasaron 28 días */
  canGenerate(): boolean {
    if (!this.activeRoutine) return true;
    return this.daysRemaining() === 0;
  }

  /** Indica si la rutina activa es personalizada */
  routinePersonalized(): boolean {
    return Boolean(this.activeRoutine?.isPersonalized ?? this.activeRoutine?.personalized);
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}