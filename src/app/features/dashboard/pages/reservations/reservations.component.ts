import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { Reservation, ShiftResponse } from '../../../../shared/interfaces/dashboard.interface';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss',
})
export class ReservationsComponent implements OnInit {
  private allShifts: ShiftResponse[] = [];
  shifts: ShiftResponse[] = [];
  reservations: Reservation[] = [];
  adminReservations: Reservation[] = [];
  loading = false;
  message = '';
  error = '';
  readonly isAdmin = this.auth.getRol() === 'admin';
  readonly minDate = new Date().toISOString().slice(0, 10);

  readonly form = this.fb.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadShifts();
    if (this.isAdmin) {
      this.loadAdminReservations();
    } else {
      this.loadReservations();
    }
  }

  loadShifts(): void {
    const date = this.form.value.date || '';
    if (!date) return;
    if (date < this.minDate) {
      this.error = 'Selecciona una fecha desde hoy en adelante.';
      this.shifts = [];
      return;
    }

    this.loading = true;
    this.error = '';
    this.api.getAvailableShifts(date).subscribe({
      next: shifts => {
        this.allShifts = shifts;
        this.applyReservedShiftFilter();
        this.loading = false;
      },
      error: err => {
        this.shifts = [];
        this.error = this.friendlyMessage(err.error?.message, 'No se pudieron cargar los horarios disponibles.');
        this.loading = false;
      },
    });
  }

  reserve(shift: ShiftResponse): void {
    if (this.isAdmin) return;

    const startTime = shift.startTime;
    const date = this.form.value.date || '';
    if (!startTime || !date || shift.available === false) return;
    if (date < this.minDate) {
      this.error = 'Selecciona una fecha desde hoy en adelante.';
      return;
    }

    this.loading = true;
    this.api.createReservation(date, startTime).subscribe({
      next: response => {
        this.message = response.message || 'Reserva creada.';
        this.loading = false;
        this.loadReservations();
        this.loadShifts();
      },
      error: err => {
        this.error = this.friendlyMessage(err.error?.message, 'No se pudo crear la reserva.');
        this.loading = false;
      },
    });
  }

  cancelReservation(reservation: Reservation): void {
    if (!reservation.idReservation) return;
    this.loading = true;
    this.error = '';
    this.message = '';
    this.api.cancelReservation(reservation.idReservation).subscribe({
      next: response => {
        this.message = response.message || 'Reserva cancelada.';
        this.loading = false;
        if (this.isAdmin) {
          this.loadAdminReservations();
        } else {
          this.loadReservations();
        }
        this.loadShifts();
      },
      error: err => {
        this.error = this.friendlyMessage(err.error?.message, 'No se pudo cancelar la reserva.');
        this.loading = false;
      },
    });
  }

  loadReservations(): void {
    if (this.isAdmin) return;

    this.api.getMyReservations().subscribe({
      next: reservations => {
        this.reservations = reservations;
        this.applyReservedShiftFilter();
      },
      error: () => { this.reservations = []; },
    });
  }

  loadAdminReservations(): void {
    if (!this.isAdmin) return;

    this.api.getAllReservations().subscribe({
      next: reservations => {
        this.adminReservations = reservations;
      },
      error: err => {
        this.adminReservations = [];
        this.error = this.friendlyMessage(err.error?.message, 'No se pudieron cargar las reservas registradas.');
      },
    });
  }

  userName(reservation: Reservation): string {
    const user = reservation.user;
    if (!user) return 'Usuario';
    return `${user.names || ''} ${user.surnames || ''}`.trim() || user.email || 'Usuario';
  }

  userDocument(reservation: Reservation): string {
    const user = reservation.user;
    if (!user) return '-';
    return `${user.docType || ''} ${user.docNumber || user.docNum || ''}`.trim() || '-';
  }

  private applyReservedShiftFilter(): void {
    if (this.isAdmin) {
      this.shifts = this.allShifts;
      return;
    }

    const selectedDate = this.form.value.date || '';
    this.shifts = this.allShifts.filter(shift => !this.hasActiveReservation(selectedDate, shift.startTime));
  }

  private hasActiveReservation(date: string, startTime?: string): boolean {
    if (!date || !startTime) return false;
    return this.reservations.some(reservation =>
      reservation.state &&
      reservation.date === date &&
      this.normalizeTime(reservation.startTime) === this.normalizeTime(startTime)
    );
  }

  private normalizeTime(time?: string): string {
    return (time || '').slice(0, 5);
  }

  private friendlyMessage(message: string | undefined, fallback: string): string {
    const text = (message || '').toLowerCase();
    if (!text) return fallback;
    if (text.includes('validation failed') || text.includes('fecha') || text.includes('hora')) {
      return 'Selecciona una fecha y un horario valido.';
    }
    if (text.includes('already') || text.includes('ya tienes')) {
      return 'Ya tienes una reserva para ese horario.';
    }
    if (text.includes('spots') || text.includes('cupos')) {
      return 'No hay cupos disponibles para ese horario.';
    }
    if (text.includes('permission') || text.includes('permiso')) {
      return 'No tienes permiso para realizar esta accion.';
    }
    return message || fallback;
  }
}
