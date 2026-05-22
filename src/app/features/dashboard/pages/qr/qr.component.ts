import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { UserProfile } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-qr',
  templateUrl: './qr.component.html',
  styleUrl: './qr.component.scss',
})
export class QrComponent implements OnInit, OnDestroy {
  qrValue = '';
  qrImage = '';
  secondsLeft = 60;
  loading = false;
  error = '';
  profile: UserProfile | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private api: DashboardApiService) {}

  ngOnInit(): void {
    this.api.getMe().subscribe({
      next: profile => {
        this.profile = profile;
        this.generate();
      },
      error: () => {
        this.error = 'No se pudo cargar el perfil para generar el QR.';
      },
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  generate(): void {
    if (!this.profile?.idUser) {
      this.error = 'No se pudo identificar el usuario para generar el QR.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.api.generateAttendanceQr(this.profile.idUser).subscribe({
      next: response => {
        this.qrImage = response.qrBase64 || '';
        this.qrValue = response.token || '';
        this.loading = false;
        if (!this.qrImage) {
          this.error = 'No se recibio una imagen QR valida.';
          return;
        }
        this.startTimer();
      },
      error: () => {
        this.error = 'No se pudo generar el QR. Verifica tu sesion e intenta de nuevo.';
        this.loading = false;
      },
    });
  }

  initials(): string {
    const name = this.profile?.names || 'Juan Garcia';
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  displayName(): string {
    return this.profile?.names || 'Juan Garcia';
  }

  userCode(): string {
    const id = this.profile?.idUser || 8832;
    return `VF-2024-${id}`;
  }

  downloadQr(): void {
    if (!this.qrImage) return;
    const link = document.createElement('a');
    link.href = this.qrImage;
    link.download = 'volticfit-qr.png';
    link.click();
  }

  private startTimer(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.secondsLeft = 60;
    this.intervalId = setInterval(() => {
      this.secondsLeft -= 1;
      if (this.secondsLeft <= 0) {
        this.generate();
      }
    }, 1000);
  }
}
