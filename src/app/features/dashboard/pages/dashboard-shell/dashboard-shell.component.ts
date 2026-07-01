import { Component, OnInit, OnDestroy as NgOnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InactivityService } from '../../../../core/services/inactivity.service';

interface NavItem {
  label: string;
  route: string;
  roles: string[];
  section: string;
  icon: string;   // SVG path(s) string
}

@Component({
  selector: 'app-dashboard-shell',
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent implements OnInit {
  readonly rol = this.auth.getRol() || 'observador';
  readonly roleLabel = this.getRoleLabel(this.rol);
  readonly homeRoute = this.rol === 'admin' ? '/admin' : '/dashboard';
  sidebarOpen = false;
  initials = '';
  avatar = '';

  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar(): void  { this.sidebarOpen = false; }

  // SVG icon paths (viewBox 0 0 24 24, stroke-based)
  private icons: Record<string, string> = {
    inicio:       `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    notif:        `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
    chat:         `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
    reservas:     `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
    evaluacion:   `<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`,
    rutinas:      `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
    historia:     `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`,
    diagnostico:  `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`,
    sanciones:    `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
    asistencias:  `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`,
    qr:           `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3"/><rect x="16" y="5" width="3" height="3"/><rect x="16" y="16" width="3" height="3"/><rect x="5" y="16" width="3" height="3"/>`,
    progreso:     `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
    fallas:       `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
    perfil:       `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    dashboard:    `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
    reportes:     `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
    usuarios:     `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    equipos:      `<rect x="2" y="10" width="3" height="4" rx="1"/><rect x="7" y="7" width="3" height="10" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/><rect x="14" y="7" width="3" height="10" rx="1"/><rect x="19" y="10" width="3" height="4" rx="1"/>`,
    mantenimiento:`<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M4.93 4.93l1.41 1.41M18.66 18.66l1.41 1.41M20 12h2M2 12h2M12 20v2M12 2v2"/>`,
    escanear:     `<polyline points="23 7 23 1 17 1"/><line x1="16" y1="8" x2="23" y2="1"/><polyline points="1 17 1 23 7 23"/><line x1="8" y1="16" x2="1" y2="23"/><polyline points="7 1 1 1 1 7"/><line x1="1" y1="1" x2="8" y2="8"/><polyline points="17 23 23 23 23 17"/><line x1="16" y1="16" x2="23" y2="23"/>`,
    registro:     `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    soporte:      `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
    notifcreate:  `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="12" y1="3" x2="12" y2="1"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,
    logout:       `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
  };

  readonly navItems: NavItem[] = [
    { label: 'Inicio',                  route: './',                     roles: ['aprendiz', 'funcionario', 'observador'], section: 'Principal',    icon: 'inicio' },
    { label: 'Notificaciones',          route: './notifications',        roles: ['aprendiz', 'funcionario'],               section: 'Principal',    icon: 'notif' },
    { label: 'Chat con el instructor',  route: './chatbot',              roles: ['aprendiz', 'funcionario'],               section: 'Principal',    icon: 'chat' },
    { label: 'Reservas de turnos',      route: './reservations',         roles: ['aprendiz', 'funcionario'],               section: 'Entrenamiento',icon: 'reservas' },
    { label: 'Evaluacion fisica',       route: './evaluations',          roles: ['aprendiz', 'funcionario'],               section: 'Entrenamiento',icon: 'evaluacion' },
    { label: 'Rutinas',                 route: './routines',             roles: ['aprendiz', 'funcionario'],               section: 'Entrenamiento',icon: 'rutinas' },
    { label: 'Historia clinica',        route: './clinical-history',     roles: ['aprendiz', 'funcionario'],               section: 'Entrenamiento',icon: 'historia' },
    { label: 'Diagnostico',             route: './diagnosis',            roles: ['aprendiz', 'funcionario'],               section: 'Entrenamiento',icon: 'diagnostico' },
    { label: 'Sanciones',               route: './sanctions',            roles: ['aprendiz', 'funcionario'],               section: 'Mi cuenta',    icon: 'sanciones' },
    { label: 'Asistencias',             route: './attendance-history',   roles: ['aprendiz', 'funcionario'],               section: 'Mi cuenta',    icon: 'asistencias' },
    { label: 'Generar QR',              route: './qr',                   roles: ['aprendiz', 'funcionario'],               section: 'Mi cuenta',    icon: 'qr' },
    { label: 'Progreso',                route: './progress',             roles: ['aprendiz', 'funcionario'],               section: 'Mi cuenta',    icon: 'progreso' },
    { label: 'Reporte de fallas',       route: './failures',             roles: ['aprendiz', 'funcionario'],               section: 'Mi cuenta',    icon: 'fallas' },

    { label: 'Dashboard',               route: './',                     roles: ['admin'],                                 section: 'Principal',    icon: 'dashboard' },
    { label: 'Reportes',                route: './reports',              roles: ['admin'],                                 section: 'Reportes',     icon: 'reportes' },
    { label: 'Chat con usuarios',       route: './support/instructor',   roles: ['admin'],                                 section: 'Comunicacion', icon: 'soporte' },
    { label: 'Sanciones',               route: './sanctions',            roles: ['admin'],                                 section: 'Sanciones',    icon: 'sanciones' },
    { label: 'Notificaciones',          route: './notifications/create', roles: ['admin'],                                 section: 'Notificaciones',icon: 'notifcreate' },
    { label: 'Fallas de equipos',       route: './failures',             roles: ['admin'],                                 section: 'Equipos',      icon: 'fallas' },
    { label: 'Equipos',                 route: './machines',             roles: ['admin'],                                 section: 'Equipos',      icon: 'equipos' },
    { label: 'Mantenimiento',           route: './maintenance/history',  roles: ['admin'],                                 section: 'Equipos',      icon: 'mantenimiento' },
    { label: 'Usuarios',                route: './users',                roles: ['admin'],                                 section: 'Gestion',      icon: 'usuarios' },
    { label: 'Administrar reservas',    route: './reservations',         roles: ['admin'],                                 section: 'Gestion',      icon: 'reservas' },
    { label: 'Administrar evaluaciones',route: './evaluations',          roles: ['admin'],                                 section: 'Gestion',      icon: 'evaluacion' },
    { label: 'Historia clinica',        route: './clinical-history',     roles: ['admin'],                                 section: 'Gestion',      icon: 'historia' },
    { label: 'Diagnostico',             route: './diagnosis',            roles: ['admin'],                                 section: 'Gestion',      icon: 'diagnostico' },
    { label: 'Registro manual',         route: './manual-attendance',    roles: ['admin'],                                 section: 'Asistencia',   icon: 'registro' },
    { label: 'Escanear QR',             route: './access',               roles: ['admin'],                                 section: 'Asistencia',   icon: 'escanear' },
  ];

  constructor(
    private auth: AuthService,
    private inactivity: InactivityService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {
    if (this.auth.isAuthenticated()) {
      this.inactivity.iniciar();
    }
    // Iniciales desde el email del JWT (ej: juan.perez@gmail.com → JP)
    const email = this.auth.getEmailFromToken() || '';
    const partes = email.split('@')[0].split(/[._-]/);
    this.initials = partes
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase() || '')
      .join('') || this.rol[0]?.toUpperCase() || 'U';
    // Avatar emoji guardado en localStorage con clave por usuario
    const avatarKey = this.auth.getAvatarStorageKey();
    this.avatar = localStorage.getItem(avatarKey) || '';
  }

  ngOnInit(): void {
    const avatarKey = this.auth.getAvatarStorageKey();
    window.addEventListener('storage', (e) => {
      if (e.key === avatarKey) this.avatar = e.newValue || '';
    });
  }

  getIconSvg(iconKey: string): string {
    return this.icons[iconKey] || this.icons['inicio'];
  }

  buildSvg(iconKey: string): SafeHtml {
    const paths = this.icons[iconKey] || this.icons['inicio'];
    const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  visibleItems(): NavItem[] {
    return this.navItems.filter(item => item.roles.includes(this.rol));
  }

  visibleSections(): string[] {
    return Array.from(new Set(this.visibleItems().map(item => item.section)));
  }

  itemsBySection(section: string): NavItem[] {
    return this.visibleItems().filter(item => item.section === section);
  }

  isQrFocus(): boolean {
    return this.router.url.endsWith('/qr');
  }

  isChatRoute(): boolean {
    return this.router.url.includes('/chatbot');
  }

  logout(): void {
    this.inactivity.detener();
    this.auth.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    this.auth.removeToken();
    this.router.navigate(['/auth/login']);
  }

  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      aprendiz: 'Aprendiz',
      funcionario: 'Funcionario',
      observador: 'Observador',
    };
    return labels[role] || 'Usuario';
  }
}
