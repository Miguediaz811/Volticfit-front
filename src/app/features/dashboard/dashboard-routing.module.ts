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
import { ReportsComponent } from './pages/reports/reports.component';
import { SupportInboxComponent } from './pages/support-inbox/support-inbox.component';
import { FailuresComponent } from './pages/failures/failures.component';
import { MaintenanceHistoryComponent } from './pages/maintenance-history/maintenance-history.component';
import { SupportPageComponent } from './pages/support-page/support-page.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { ProgressComponent } from './pages/progress/progress.component';
import { authGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      { path: '', component: OverviewComponent },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      { path: 'qr', component: QrComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'access', component: AttendanceAccessComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'manual-attendance', component: ManualAttendanceComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'attendance-history', component: AttendanceHistoryComponent, canActivate: [authGuard], data: { roles: ['aprendiz', 'funcionario'] } },
      { path: 'routines', component: RoutinesComponent, canActivate: [authGuard], data: { roles: ['aprendiz', 'funcionario'] } },
      { path: 'routines/edit', component: RoutinesComponent, canActivate: [authGuard], data: { roles: ['aprendiz', 'funcionario'] } },
      { path: 'evaluations', component: PhysicalEvaluationsComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'clinical-history', component: ClinicalHistoryComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'diagnosis', component: DiagnosisRestrictionsComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'sanctions', component: SanctionListComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'sanctions/history', component: SanctionListComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'profile/edit', component: ProfileComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'profile/delete', component: ProfileComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'users', component: UserManagementComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'machines', component: MachinesComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'machines/list', component: MachinesComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'machines/edit', component: MachinesComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'reservations', component: ReservationsComponent, canActivate: [authGuard], data: { roles: ['admin', 'aprendiz', 'funcionario'] } },
      { path: 'chatbot', component: SupportPageComponent, canActivate: [authGuard], data: { roles: ['aprendiz', 'funcionario'] } },
      {
        path: 'support/instructor',
        component: SupportInboxComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'progress',
        component: ProgressComponent,
        canActivate: [authGuard],
        data: { roles: ['aprendiz', 'funcionario'] },
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'aprendiz', 'funcionario'] },
      },
      {
        path: 'notifications/create',
        component: NotificationsComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'notifications/history',
        component: NotificationsComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'failures',
        component: FailuresComponent,
        canActivate: [authGuard],
        data: { roles: ['admin', 'aprendiz', 'funcionario'] },
      },
      {
        path: 'failures/history',
        component: FailuresComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] },
      },
      { path: 'reports', component: ReportsComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
      { path: 'reports/maintenance', redirectTo: 'reports', pathMatch: 'full' },
      { path: 'reports/attendance', redirectTo: 'reports', pathMatch: 'full' },
      { path: 'reports/sanctions', redirectTo: 'reports', pathMatch: 'full' },
      {
        path: 'maintenance/history',
        component: MaintenanceHistoryComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
