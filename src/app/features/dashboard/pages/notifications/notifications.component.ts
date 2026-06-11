import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { NotificationItem, UserProfile } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationItem[] = [];
  users: UserProfile[] = [];
  loading = false;
  saving = false;
  message = '';
  error = '';
  readonly isAdmin = this.auth.getRol() === 'admin';
  readonly minDate = new Date().toISOString().slice(0, 10);

  // 'specific' = usuario concreto | 'all' = todos
  targetMode: 'specific' | 'all' = 'specific';

  // Todas las notificaciones (admin)
  allNotifications: NotificationItem[] = [];
  allNotifsLoading = false;

  form = this.fb.group({
    usuarioDestinoId: ['', [Validators.required]],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    mensaje: ['', [Validators.required, Validators.minLength(6)]],
    tipo: ['General', [Validators.required]],
    fechaExpiracion: [''],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadNotifications();
    if (this.isAdmin) {
      this.loadUsers();
      this.loadAllNotifications();
    }
  }

  setTargetMode(mode: 'specific' | 'all'): void {
    this.targetMode = mode;
    if (mode === 'all') {
      this.form.get('usuarioDestinoId')?.clearValidators();
      this.form.get('usuarioDestinoId')?.setValue('');
    } else {
      this.form.get('usuarioDestinoId')?.setValidators([Validators.required]);
    }
    this.form.get('usuarioDestinoId')?.updateValueAndValidity();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = '';
    this.api.getNotifications().subscribe({
      next: notifications => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || err?.message || 'No se pudieron cargar las notificaciones.';
        this.loading = false;
      },
    });
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: users => { this.users = users.filter(user => this.userRole(user) !== 'admin'); },
      error: () => { this.users = []; },
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const expiration = this.form.value.fechaExpiracion;
    const base = {
      titulo: this.form.value.titulo || '',
      mensaje: this.form.value.mensaje || '',
      tipo: this.form.value.tipo || 'General',
      fechaExpiracion: expiration ? `${expiration}T23:59:59` : undefined,
    };

    this.saving = true;
    this.message = '';
    this.error = '';

    const request$ = this.targetMode === 'all'
      ? this.api.createNotificationForAll(base)
      : this.api.createNotification({
          ...base,
          usuarioDestinoId: Number(this.form.value.usuarioDestinoId),
        });

    request$.subscribe({
      next: response => {
        this.message = response.message || 'Notificacion creada correctamente.';
        this.loadAllNotifications();
        this.form.reset({ usuarioDestinoId: '', titulo: '', mensaje: '', tipo: 'General', fechaExpiracion: '' });
        this.targetMode = 'specific';
        this.form.get('usuarioDestinoId')?.setValidators([Validators.required]);
        this.form.get('usuarioDestinoId')?.updateValueAndValidity();
        this.saving = false;
      },
      error: err => {
        this.error = err?.error?.message || err?.message || 'No se pudo crear la notificacion.';
        this.saving = false;
      },
    });
  }

  markAsRead(notification: NotificationItem): void {
    this.api.markNotificationAsRead(notification.id).subscribe({
      next: () => this.loadNotifications(),
      error: err => { this.error = err?.error?.message || err?.message || 'No se pudo actualizar la notificacion.'; },
    });
  }

  delete(notification: NotificationItem): void {
    this.api.deleteNotification(notification.id).subscribe({
      next: () => this.loadNotifications(),
      error: err => { this.error = err?.error?.message || err?.message || 'No se pudo eliminar la notificacion.'; },
    });
  }

  userLabel(user: UserProfile): string {
    const doc = user.docNumber || user.docNum || 'sin documento';
    return `${user.names} ${user.surnames || ''} - ${doc}`.trim();
  }

  loadAllNotifications(): void {
    this.allNotifsLoading = true;
    this.api.getAllNotificationsAdmin().subscribe({
      next: notifs => {
        this.allNotifications = notifs;
        this.allNotifsLoading = false;
      },
      error: () => {
        this.allNotifications = [];
        this.allNotifsLoading = false;
      },
    });
  }

  private userRole(user: UserProfile): string {
    const role = typeof user.role === 'string' ? user.role : user.role?.name;
    return (role || '').toLowerCase().replace(/^role_/, '');
  }
}
