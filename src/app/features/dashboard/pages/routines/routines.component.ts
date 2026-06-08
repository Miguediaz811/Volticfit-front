import { Component, OnInit } from '@angular/core';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { RoutineHistoryItem, RoutineResponse } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-routines',
  templateUrl: './routines.component.html',
  styleUrl: './routines.component.scss',
})
export class RoutinesComponent implements OnInit {
  activeRoutine: RoutineResponse | null = null;
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
      },
      error: err => {
        this.activeRoutine = null;
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

  generateRoutine(): void {
    this.generating = true;
    this.message = '';
    this.error = '';

    this.api.generateRoutine().subscribe({
      next: routine => {
        this.activeRoutine = routine;
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
        this.loadActiveRoutine();
        this.loadHistory();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo completar la rutina.');
        this.completing = false;
      },
    });
  }

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