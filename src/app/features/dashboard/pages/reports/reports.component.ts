import { Component, OnInit } from '@angular/core';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { AttendanceResult, UserProfile } from '../../../../shared/interfaces/dashboard.interface';

type ReportType = 'maintenance' | 'machines' | 'attendance' | 'sanctions';

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  fields: string[];
}

interface ReportRecord {
  id: number;
  type: string;
  format: string;
  generationDate: string;
  content?: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  readonly reportOptions: ReportOption[] = [
    {
      id: 'maintenance',
      title: 'Reporte de mantenimiento',
      description: 'Mantenimientos preventivos, responsables y fechas programadas.',
      fields: ['Equipo', 'Tipo', 'Responsable', 'Estado', 'Rango de fechas'],
    },
    {
      id: 'machines',
      title: 'Reporte de equipos',
      description: 'Inventario de maquinas registradas y su estado operativo.',
      fields: ['Equipo', 'Tipo', 'Estado'],
    },
    {
      id: 'attendance',
      title: 'Reporte de asistencia',
      description: 'Ingresos, salidas, usuarios y turnos registrados.',
      fields: ['Usuario', 'Turno', 'Rango de fechas'],
    },
    {
      id: 'sanctions',
      title: 'Reporte de sanciones',
      description: 'Sanciones activas, historial y clasificacion.',
      fields: ['Usuario', 'Estado', 'Tipo de sancion', 'Clasificacion'],
    },
  ];

  selectedType: ReportType = 'attendance';
  fromDate = '';
  toDate = '';
  status = '';
  message = '';
  error = '';
  loading = false;

  // Datos de previsualización de asistencia
  attendanceRows: AttendanceResult[] = [];
  totalElements = 0;
  currentPage = 0;
  pageSize = 10;

  // Datos de mantenimiento
  maintenanceRows: any[] = [];

  // Datos de sanciones
  sanctionRows: any[] = [];

  // Datos de maquinas
  machineRows: any[] = [];

  users: UserProfile[] = [];
  selectedUserId = '';
  userSearchTerm = '';

  // Historial de reportes generados (Realiza_Reporte)
  reportHistory: ReportRecord[] = [];
  historyLoading = false;
  showHistory = false;

  constructor(private api: DashboardApiService) {}

  readonly maxDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    const now = new Date();
    const past = new Date(now);
    past.setDate(past.getDate() - 30);
    this.fromDate = past.toISOString().split('T')[0];
    this.toDate = this.maxDate;
    this.loadReportHistory();
    this.loadUsers();
  }

  get selectedReport(): ReportOption {
    return this.reportOptions.find(o => o.id === this.selectedType) || this.reportOptions[0];
  }

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  selectReport(type: ReportType): void {
    this.selectedType = type;
    this.message = '';
    this.error = '';
    this.attendanceRows = [];
    this.maintenanceRows = [];
    this.sanctionRows = [];
    this.machineRows = [];
    this.selectedUserId = '';
    this.totalElements = 0;
    this.currentPage = 0;
    this.toDate = this.maxDate;
  }

  generateReport(): void {
    this.loading = true;
    this.error = '';
    this.message = '';
    this.attendanceRows = [];
    this.maintenanceRows = [];
    this.sanctionRows = [];
    this.machineRows = [];

    if (this.selectedType === 'attendance') {
      const userId = this.selectedUserId ? Number(this.selectedUserId) : undefined;
      const request$ = userId
        ? this.api.getAllAttendanceByUser(userId, this.fromDate || undefined, this.toDate || undefined)
        : this.api.getAllAttendance(this.fromDate || undefined, this.toDate || undefined);
      request$.subscribe({
        next: rows => {
          this.attendanceRows = rows;
          this.totalElements = rows.length;
          this.loading = false;
          if (rows.length === 0) {
            this.message = 'No se encontraron registros de asistencia para los filtros seleccionados.';
          }
          this.persistReportRecord('attendance');
        },
        error: err => {
          this.error = err?.error?.message || 'No se pudo obtener los datos de asistencia.';
          this.loading = false;
        },
      });
    } else if (this.selectedType === 'maintenance') {
      this.api.getMaintenanceReport(this.fromDate || undefined, this.toDate || undefined).subscribe({
        next: rows => {
          this.maintenanceRows = rows;
          this.loading = false;
          if (rows.length === 0) {
            this.message = 'No se encontraron registros de mantenimiento para los filtros seleccionados.';
          }
          this.persistReportRecord('maintenance');
        },
        error: err => {
          this.error = err?.error?.message || 'No se pudo obtener los datos de mantenimiento.';
          this.loading = false;
        },
      });
    } else if (this.selectedType === 'sanctions') {
      const userId = this.selectedUserId ? Number(this.selectedUserId) : undefined;
      this.api.getSanctionsReportByUser(userId, this.fromDate || undefined, this.toDate || undefined, this.status || undefined).subscribe({
        next: rows => {
          this.sanctionRows = rows.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
          this.loading = false;
          if (rows.length === 0) {
            this.message = 'No se encontraron sanciones para los filtros seleccionados.';
          }
          this.persistReportRecord('sanctions');
        },
        error: err => {
          this.error = err?.error?.message || 'No se pudo obtener los datos de sanciones.';
          this.loading = false;
        },
      });
    } else if (this.selectedType === 'machines') {
      this.api.getMachines().subscribe({
        next: rows => {
          let filtered = rows.filter(m => {
            const name = (m.name || '').toLowerCase();
            const type = (m.type || '').toLowerCase();
            return name !== 'sin maquina' && type !== 'peso corporal';
          });
          if (this.status === 'activo') {
            filtered = filtered.filter(m => m.state === true);
          } else if (this.status === 'inactivo') {
            filtered = filtered.filter(m => m.state === false);
          }
          this.machineRows = filtered;
          this.loading = false;
          if (this.machineRows.length === 0) {
            this.message = 'No se encontraron equipos registrados.';
          }
          this.persistReportRecord('machines');
        },
        error: err => {
          this.error = err?.error?.message || 'No se pudo obtener los datos de equipos.';
          this.loading = false;
        },
      });
    }
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.generateReport();
  }

  exportReport(format: 'pdf' | 'excel'): void {
    const reportKey = this.exportType();
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const filename = `${reportKey}-report.${extension}`;

    this.loading = true;
    this.error = '';
    this.message = '';

    const userId = (reportKey === 'attendance' || reportKey === 'sanctions') && this.selectedUserId
      ? Number(this.selectedUserId)
      : undefined;

    const status = (reportKey === 'sanctions' || reportKey === 'machines') ? (this.status || undefined) : undefined;
    this.api.exportReport(format, reportKey, userId, this.fromDate || undefined, this.toDate || undefined, status).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        this.message = `Reporte exportado como ${format.toUpperCase()}.`;
        this.loading = false;
        // Registrar exportación en BD
        this.persistReportRecord(reportKey, () => this.loadReportHistory());
      },
      error: err => {
        this.error = err?.error?.message || err?.message || 'No se pudo exportar el reporte.';
        this.loading = false;
      },
    });
  }

  loadReportHistory(): void {
    this.historyLoading = true;
    this.api.getMyReports().subscribe({
      next: reports => {
        this.reportHistory = reports;
        this.historyLoading = false;
      },
      error: () => {
        this.reportHistory = [];
        this.historyLoading = false;
      },
    });
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
    if (this.showHistory) {
      this.loadReportHistory();
    }
  }

  private persistReportRecord(type: string, callback?: () => void): void {
    this.api.generateReport({
      type,
      format: 'internal',
      startDate: this.fromDate || undefined,
      endDate: this.toDate || undefined,
    }).subscribe({
      next: () => {
        this.loadReportHistory();
        callback?.();
      },
      error: () => {
        // No bloquear la UI si falla el registro
        callback?.();
      },
    });
  }

  translateType(type: string): string {
    const map: Record<string, string> = {
      attendance:  'Asistencia',
      sanctions:   'Sanciones',
      maintenance: 'Mantenimiento',
      machines:    'Equipos',
    };
    return map[type?.toLowerCase()] ?? type;
  }

  translateFormat(format: string): string {
    const map: Record<string, string> = {
      internal: 'Interno',
      pdf:      'PDF',
      excel:    'Excel',
      json:     'JSON',
    };
    return map[format?.toLowerCase()] ?? format;
  }

  private exportType(): 'attendance' | 'machines' | 'maintenance' | 'sanctions' {
    if (this.selectedType === 'attendance') return 'attendance';
    if (this.selectedType === 'sanctions') return 'sanctions';
    if (this.selectedType === 'maintenance') return 'maintenance';
    return 'machines';
  }

  private loadUsers(): void {
    this.api.getUsers().subscribe({
      next: users => { this.users = users; },
      error: () => { this.users = []; },
    });
  }

  get filteredUsers(): UserProfile[] {
    const term = this.normalize(this.userSearchTerm);
    if (!term) return this.users;
    return this.users.filter(user =>
      this.normalize([user.names, user.surnames, user.email, user.docNumber, user.docNum, user.phone].join(' ')).includes(term)
    );
  }

  userLabel(user: UserProfile): string {
    const doc = user.docNumber || user.docNum || 'sin documento';
    return `${user.names} ${user.surnames || ''} - ${doc}`.trim();
  }

  selectUser(user: UserProfile): void {
    this.selectedUserId = String(user.idUser);
    this.userSearchTerm = '';
  }

  private normalize(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
}
