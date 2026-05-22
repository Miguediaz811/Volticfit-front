import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { UserProfile } from '../../../../shared/interfaces/dashboard.interface';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
})
export class OverviewComponent implements OnInit {
  profile: UserProfile | null = null;
  error = '';
  loading = true;
  readonly rol = this.auth.getRol() || 'observador';
  memberStats = [
    { label: 'Reservas activas', value: '0' },
    { label: 'Sanciones activas', value: '0', danger: false },
  ];
  readonly memberActions = [
    { title: 'Reservar turno', text: 'Consulta cupos disponibles', route: 'reservations', tone: 'blue' },
    { title: 'Mis asistencias', text: 'Revisa entradas y salidas', route: 'attendance-history', tone: 'green' },
    { title: 'Sanciones', text: 'Consulta tu historial', route: 'sanctions', tone: 'gold' },
  ];
  adminStats = [
    { label: 'Usuarios registrados', value: '0', note: 'segun listado actual', tone: 'green' },
    { label: 'Sanciones activas', value: '0', note: 'segun historial actual', tone: 'orange' },
    { label: 'Turnos disponibles', value: '0', note: 'cupos para hoy', tone: 'gold' },
  ];

  constructor(private api: DashboardApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const today = this.formatDate(new Date());

    const baseRequests = {
      profile: this.api.getMe().pipe(catchError(() => of(null))),
      sanctions: this.api.getSanctions().pipe(catchError(() => of([]))),
      shifts: this.api.getAvailableShifts(today).pipe(catchError(() => of([]))),
    };

    const requests = this.rol === 'admin'
      ? { ...baseRequests, users: this.api.getUsers().pipe(catchError(() => of([]))) }
      : { ...baseRequests, reservations: this.api.getMyReservations().pipe(catchError(() => of([]))) };

    forkJoin(requests).subscribe({
      next: data => {
        this.profile = data.profile;
        const activeSanctions = data.sanctions.filter(sanction => sanction.state).length;
        const availableSpots = data.shifts.reduce((total, shift) => total + (shift.availableSpots ?? 0), 0);

        if (this.rol === 'admin' && 'users' in data) {
          this.adminStats = [
            { label: 'Usuarios registrados', value: String(data.users.length), note: 'segun listado actual', tone: 'green' },
            { label: 'Sanciones activas', value: String(activeSanctions), note: 'requieren seguimiento', tone: 'orange' },
            { label: 'Turnos disponibles', value: String(availableSpots), note: 'cupos para hoy', tone: 'gold' },
          ];
        }

        if (this.rol !== 'admin' && 'reservations' in data) {
          const activeReservations = data.reservations.filter(reservation => reservation.state).length;
          this.memberStats = [
            { label: 'Reservas activas', value: String(activeReservations) },
            { label: 'Sanciones activas', value: String(activeSanctions), danger: activeSanctions > 0 },
          ];
        }

        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la informacion del panel.';
        this.loading = false;
      },
    });
  }

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
