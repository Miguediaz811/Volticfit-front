import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { AttendanceResult, UserProfile } from '../../../../shared/interfaces/dashboard.interface';
import { AuthService } from '../../../../core/services/auth.service';

interface DayBar {
  label: string;
  count: number;
  heightPct: string;
}

interface ShiftSlice {
  label: string;
  count: number;
  pct: number;
}

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

  memberStatus = 'Activo';
  nextShiftText = 'Sin turnos proximos';

  memberActions = [
    { title: 'Reservar turno', text: 'Sin turnos proximos', route: 'reservations', tone: 'blue' },
    { title: 'Evaluacion fisica', text: 'Agenda tu proxima sesion', route: 'evaluations', tone: 'green' },
    { title: 'Mis rutinas', text: 'Rutinas activas este mes', route: 'routines', tone: 'gold' },
    { title: 'Ver progreso', text: 'IMC, peso y masa muscular', route: 'progress', tone: 'purple' },
    { title: 'Generar QR', text: 'Codigo de acceso dinamico', route: 'qr', tone: 'gold' },
    { title: 'Reporte de fallas', text: 'Informa fallas en equipos', route: 'failures', tone: 'red' },
    { title: 'Notificaciones', text: 'Novedades y avisos recientes', route: 'notifications', tone: 'blue' },
    { title: 'Perfil', text: 'Edita o desactiva tu cuenta', route: 'profile', tone: 'green' },
  ];

  adminStats = [
    { label: 'Usuarios registrados', value: '0', note: 'segun listado actual', tone: 'green' },
    { label: 'Sanciones activas', value: '0', note: 'requieren seguimiento', tone: 'orange' },
    { label: 'Turnos disponibles', value: '0', note: 'cupos para hoy', tone: 'gold' },
    { label: 'Equipos operativos', value: '0', note: 'segun inventario', tone: 'green' },
  ];

  // Gráfico de asistencia semanal
  weekBars: DayBar[] = [];

  // Donut usuarios por turno
  shiftSlices: ShiftSlice[] = [];
  totalAttendanceWeek = 0;
  donutStyle = '';

  constructor(private api: DashboardApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const today = this.formatDate(new Date());

    if (this.rol === 'admin') {
      forkJoin({
        profile:    this.api.getMe().pipe(catchError(() => of(null))),
        sanctions:  this.api.getSanctions().pipe(catchError(() => of([]))),
        shifts:     this.api.getAvailableShifts(today).pipe(catchError(() => of([]))),
        users:      this.api.getUsers().pipe(catchError(() => of([]))),
        machines:   this.api.getMachines().pipe(catchError(() => of([]))),
        attendance: this.api.getAttendanceHistory(0, 200).pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 }))),
      }).subscribe({
        next: data => {
          this.profile = data.profile;

          const activeSanctions  = data.sanctions.filter(s => s.state).length;
          const availableSpots   = data.shifts.reduce((t, s) => t + (s.availableSpots ?? 0), 0);
          const registeredUsers  = data.users.filter(u => !this.isAdminUser(u)).length;
          const operativeMachines = data.machines.filter(m => m.state === true && m.name && m.name.trim().toLowerCase() !== 'sin maquina').length;

          this.adminStats = [
            { label: 'Usuarios registrados', value: String(registeredUsers),   note: 'segun listado actual',    tone: 'green'  },
            { label: 'Sanciones activas',    value: String(activeSanctions),   note: 'requieren seguimiento',   tone: 'orange' },
            { label: 'Turnos disponibles',   value: String(availableSpots),    note: 'cupos para hoy',          tone: 'gold'   },
            { label: 'Equipos operativos',   value: String(operativeMachines), note: 'segun inventario',        tone: 'green'  },
          ];

          this.buildWeekChart(data.attendance.content);
          this.buildShiftDonut(data.attendance.content);

          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar la informacion del panel.';
          this.loading = false;
        },
      });
    } else {
      forkJoin({
        profile:      this.api.getMe().pipe(catchError(() => of(null))),
        sanctions:    this.api.getSanctions().pipe(catchError(() => of([]))),
        reservations: this.api.getMyReservations().pipe(catchError(() => of([]))),
        shifts:       this.api.getAvailableShifts(today).pipe(catchError(() => of([]))),
      }).subscribe({
        next: data => {
          this.profile = data.profile;

          // Estado del usuario
          this.memberStatus = data.profile?.state === false ? 'Inactivo' : 'Activo';

          // Sanciones y reservas
          const activeSanctions    = data.sanctions.filter(s => s.state).length;
          const activeReservations = data.reservations.filter(r => r.state).length;
          this.memberStats = [
            { label: 'Reservas activas',  value: String(activeReservations) },
            { label: 'Sanciones activas', value: String(activeSanctions), danger: activeSanctions > 0 },
          ];

          // Próximo turno disponible
          const nextShift = data.shifts
            .filter(s => (s.availableSpots ?? 0) > 0)
            .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))[0];

          const nextShiftText = nextShift
            ? `Proximo disponible: hoy ${nextShift.startTime?.slice(0, 5) ?? ''} h`
            : 'Sin turnos disponibles hoy';

          this.memberActions = this.memberActions.map(a =>
            a.route === 'reservations' ? { ...a, text: nextShiftText } : a
          );

          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar la informacion del panel.';
          this.loading = false;
        },
      });
    }
  }

  // ── Gráfico semanal ──────────────────────────────────────────────────────────

  private buildWeekChart(records: AttendanceResult[]): void {
    const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();
    // Inicio de la semana actual (lunes)
    const dayOfWeek = now.getDay(); // 0=Dom
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    for (const r of records) {
      const raw = r.entryTime || r.dateTime;
      if (!raw) continue;
      const d = new Date(raw);
      const idx = Math.floor((d.getTime() - monday.getTime()) / 86400000);
      if (idx >= 0 && idx <= 6) counts[idx]++;
    }

    const max = Math.max(...counts, 1);
    this.totalAttendanceWeek = counts.reduce((a, b) => a + b, 0);

    this.weekBars = days.map((label, i) => ({
      label,
      count: counts[i],
      heightPct: Math.max(8, Math.round((counts[i] / max) * 100)) + '%',
    }));
  }

  // ── Donut por turno ──────────────────────────────────────────────────────────

  private buildShiftDonut(records: AttendanceResult[]): void {
    const buckets: Record<string, number> = { Mañana: 0, Tarde: 0, Noche: 0 };

    for (const r of records) {
      const raw = r.entryTime || r.dateTime;
      if (!raw) continue;
      const hour = new Date(raw).getHours();
      if (hour >= 6 && hour < 12)       buckets['Mañana']++;
      else if (hour >= 12 && hour < 18) buckets['Tarde']++;
      else                               buckets['Noche']++;
    }

    const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;
    const colors = ['#f5a623', '#ef7f00', '#555'];
    let accumulated = 0;

    this.shiftSlices = Object.entries(buckets).map(([label, count], i) => {
      const pct = Math.round((count / total) * 100);
      return { label, count, pct };
    });

    // Construir conic-gradient
    const stops = this.shiftSlices.map((s, i) => {
      const start = accumulated;
      accumulated += s.pct;
      return `${colors[i]} ${start}% ${accumulated}%`;
    });
    this.donutStyle = `conic-gradient(${stops.join(', ')})`;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private formatDate(date: Date): string {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
  }

  private isAdminUser(user: UserProfile): boolean {
    const role = typeof user.role === 'string' ? user.role : user.role?.name;
    return (role || '').toLowerCase().replace(/^role_/, '') === 'admin';
  }
}