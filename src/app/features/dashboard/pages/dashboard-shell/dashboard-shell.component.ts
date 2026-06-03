import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InactivityService } from '../../../../core/services/inactivity.service';

interface NavItem {
  label: string;
  route: string;
  roles: string[];
  section: string;
}

@Component({
  selector: 'app-dashboard-shell',
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  readonly rol = this.auth.getRol() || 'observador';
  readonly roleLabel = this.getRoleLabel(this.rol);

  readonly navItems: NavItem[] = [
    { label: 'Inicio', route: './', roles: ['aprendiz', 'funcionario', 'observador'], section: 'Principal' },
    { label: 'Reservas de turnos', route: './reservations', roles: ['aprendiz', 'funcionario'], section: 'Entrenamiento' },
    { label: 'Evaluación física', route: './evaluations', roles: ['aprendiz', 'funcionario'], section: 'Entrenamiento' },
    { label: 'Rutinas', route: './routines', roles: ['aprendiz', 'funcionario'], section: 'Entrenamiento' },
    { label: 'Historia clínica', route: './clinical-history', roles: ['aprendiz', 'funcionario'], section: 'Entrenamiento' },
    { label: 'Diagnóstico', route: './diagnosis', roles: ['aprendiz', 'funcionario'], section: 'Entrenamiento' },
    { label: 'Sanciones', route: './sanctions', roles: ['aprendiz', 'funcionario'], section: 'Mi cuenta' },
    { label: 'Asistencias', route: './attendance-history', roles: ['aprendiz', 'funcionario'], section: 'Mi cuenta' },
    { label: 'Generar QR', route: './qr', roles: ['aprendiz', 'funcionario'], section: 'Mi cuenta' },
    { label: 'Perfil', route: './profile', roles: ['aprendiz', 'funcionario'], section: 'Mi cuenta' },
    { label: 'Dashboard', route: './', roles: ['admin'], section: 'Principal' },
    { label: 'Usuarios', route: './users', roles: ['admin'], section: 'Gestión' },
    { label: 'Máquinas', route: './machines', roles: ['admin'], section: 'Gestión' },
    { label: 'Sanciones', route: './sanctions', roles: ['admin'], section: 'Gestión' },
    { label: 'Administrar reservas', route: './reservations', roles: ['admin'], section: 'Gestión' },
    { label: 'Evaluaciones físicas', route: './evaluations', roles: ['admin'], section: 'Gestión' },
    { label: 'Historia clínica', route: './clinical-history', roles: ['admin'], section: 'Gestión' },
    { label: 'Diagnóstico', route: './diagnosis', roles: ['admin'], section: 'Gestión' },
    { label: 'Registro manual', route: './manual-attendance', roles: ['admin'], section: 'Asistencia' },
    { label: 'Escanear QR', route: './access', roles: ['admin', 'funcionario'], section: 'Asistencia' },
    { label: 'Perfil', route: './profile', roles: ['admin'], section: 'Cuenta' },
  ];

  constructor(
    private auth: AuthService,
    private inactivity: InactivityService,
    private router: Router,
  ) {
    if (this.auth.isAuthenticated()) {
      this.inactivity.iniciar();
    }
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
