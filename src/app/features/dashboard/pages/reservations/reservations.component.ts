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
  readonly isFuncionario = this.auth.getRol() === 'funcionario';
  readonly canReserve = !this.isAdmin;
  readonly minDate = new Date().toISOString().slice(0, 10);

  get minFullGymDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }

  readonly form = this.fb.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
  });

  readonly fullGymForm = this.fb.group({
    reservationDate: [
      (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().slice(0, 10);
      })(),
      Validators.required
    ],
    startTime: ['08:00', Validators.required],
    endTime: [{ value: '09:00', disabled: true }, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadShifts();
    this.form.controls.date.valueChanges.subscribe(date => {
      if (date && date < this.minDate) {
        this.form.controls.date.setValue(this.minDate, { emitEvent: false });
        this.error = 'Selecciona una fecha desde hoy en adelante.';
        this.shifts = [];
      }
    });

    this.fullGymForm.controls.startTime.valueChanges.subscribe(start => {
      if (start) {
        const [hours, minutes] = start.split(':').map(Number);
        const endHour = hours + 1;
        const endStr = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        this.fullGymForm.controls.endTime.setValue(endStr);
      }
    });

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
      this.form.controls.date.setValue(this.minDate, { emitEvent: false });
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
        this.error = this.serverMessage(err, 'No se pudieron cargar los horarios disponibles.');
        this.loading = false;
      },
    });
  }

  reserveFullGym(): void {
    if (this.fullGymForm.invalid) {
      this.fullGymForm.markAllAsTouched();
      return;
    }
    const v = this.fullGymForm.getRawValue();
    if (v.reservationDate && v.reservationDate < this.minFullGymDate) {
      this.error = 'La reserva del gimnasio completo debe hacerse con al menos un día de antelación.';
      return;
    }
    if ((v.endTime || '') <= (v.startTime || '')) {
      this.error = 'La hora de fin debe ser posterior a la hora de inicio.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.message = '';
    this.api.createFullGymReservation({
      reservationDate: v.reservationDate || '',
      startTime: v.startTime || '',
      endTime: v.endTime || '',
      reason: v.reason || '',
    }).subscribe({
      next: response => {
        this.message = response.message || 'Gimnasio reservado correctamente.';
        this.loading = false;
        this.fullGymForm.reset({
          reservationDate: this.minFullGymDate,
          startTime: '08:00',
          endTime: '09:00',
          reason: '',
        });
        this.loadShifts();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo reservar el gimnasio.');
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
      this.form.controls.date.setValue(this.minDate, { emitEvent: false });
      this.error = 'Selecciona una fecha desde hoy en adelante.';
      return;
    }

    this.loading = true;
    this.api.createReservation(date, startTime).subscribe({
      next: response => {
        this.message = response.message || '';
        this.loading = false;
        this.loadReservations();
        this.loadShifts();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo crear la reserva.');
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
        this.message = response.message || '';
        this.loading = false;
        if (this.isAdmin) {
          this.loadAdminReservations();
        } else {
          this.loadReservations();
        }
        this.loadShifts();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo cancelar la reserva.');
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
        this.error = this.serverMessage(err, 'No se pudieron cargar las reservas registradas.');
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

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}