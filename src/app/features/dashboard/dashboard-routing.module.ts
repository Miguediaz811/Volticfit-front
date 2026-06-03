import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardShellComponent } from './pages/dashboard-shell/dashboard-shell.component';
import { OverviewComponent } from './pages/overview/overview.component';
import { QrComponent } from './pages/qr/qr.component';
import { AttendanceAccessComponent } from './pages/attendance-access/attendance-access.component';
import { ManualAttendanceComponent } from './pages/manual-attendance/manual-attendance.component';
import { AttendanceHistoryComponent } from './pages/attendance-history/attendance-history.component';
import { SanctionListComponent } from './pages/sanction-list/sanction-list.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { ReservationsComponent } from './pages/reservations/reservations.component';
import { RoutinesComponent } from './pages/routines/routines.component';
import { ClinicalHistoryComponent } from './pages/clinical-history/clinical-history.component';
import { DiagnosisRestrictionsComponent } from './pages/diagnosis-restrictions/diagnosis-restrictions.component';
import { MachinesComponent } from './pages/machines/machines.component';
import { PhysicalEvaluationsComponent } from './pages/physical-evaluations/physical-evaluations.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      { path: '', component: OverviewComponent },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      { path: 'qr', component: QrComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'access', component: AttendanceAccessComponent, canActivate: [authGuard], data: { roles: ['admin', 'funcionario'] } },
      { path: 'manual-attendance', component: ManualAttendanceComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'attendance-history', component: AttendanceHistoryComponent, canActivate: [authGuard], data: { roles: ['aprendiz', 'funcionario'] } },
      { path: 'routines', component: RoutinesComponent, canActivate: [authGuard], data: { roles: ['aprendiz', 'funcionario'] } },
      { path: 'evaluations', component: PhysicalEvaluationsComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'clinical-history', component: ClinicalHistoryComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'diagnosis', component: DiagnosisRestrictionsComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'sanctions', component: SanctionListComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'users', component: UserManagementComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'machines', component: MachinesComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'reservations', component: ReservationsComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
