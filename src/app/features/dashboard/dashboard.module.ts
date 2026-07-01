import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardRoutingModule } from './dashboard-routing.module';
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
import { ChatbotComponent } from './pages/chatbot/chatbot.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { DashboardPlaceholderComponent } from './pages/dashboard-placeholder/dashboard-placeholder.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { SupportInboxComponent } from './pages/support-inbox/support-inbox.component';
import { FailuresComponent } from './pages/failures/failures.component';
import { MaintenanceHistoryComponent } from './pages/maintenance-history/maintenance-history.component';
import { SupportPageComponent } from './pages/support-page/support-page.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { ProgressComponent } from './pages/progress/progress.component';
import { UsersModule } from '../users/users.module';
import { SanctionsModule } from '../sanctions/sanctions.module';

@NgModule({
  declarations: [
    DashboardShellComponent,
    OverviewComponent,
    QrComponent,
    AttendanceAccessComponent,
    ManualAttendanceComponent,
    AttendanceHistoryComponent,
    SanctionListComponent,
    UserManagementComponent,
    ReservationsComponent,
    RoutinesComponent,
    ClinicalHistoryComponent,
    DiagnosisRestrictionsComponent,
    MachinesComponent,
    PhysicalEvaluationsComponent,
    ChatbotComponent,
    ProfileComponent,
    DashboardPlaceholderComponent,
    ReportsComponent,
    SupportInboxComponent,
    FailuresComponent,
    MaintenanceHistoryComponent,
    SupportPageComponent,
    NotificationsComponent,
    ProgressComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardRoutingModule,
    UsersModule,
    SanctionsModule,
  ],
})
export class DashboardModule {}
