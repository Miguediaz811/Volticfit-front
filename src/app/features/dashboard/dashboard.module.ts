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
import { ProfileComponent } from './pages/profile/profile.component';
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
    ProfileComponent,
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
