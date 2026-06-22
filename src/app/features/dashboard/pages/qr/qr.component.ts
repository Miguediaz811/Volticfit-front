import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
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
  avatar = '';
  currentDateTime = '';
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private api: DashboardApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const avatarKey = this.auth.getAvatarStorageKey();
    this.avatar = localStorage.getItem(avatarKey) || '';
    this.updateDateTime();

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

  updateDateTime(): void {
    const now = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    this.currentDateTime = `${dayName} ${dayNum} - ${hours}:${minutes} ${ampm}`;
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
      error: err => {
        this.error = err?.error?.message || 'No se pudo generar el QR. Verifica tu sesión e intenta de nuevo.';
        this.loading = false;
      },
    });
  }

  closeError(): void {
    this.error = '';
  }

  initials(): string {
    const name = this.profile?.names || 'Juan Garcia';
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  displayName(): string {
    if (!this.profile) return 'Juan Garcia';
    return `${this.profile.names} ${this.profile.surnames || ''}`.trim();
  }

  userCode(): string {
    const id = this.profile?.idUser || 8832;
    return `VF-2024-${id}`;
  }

  get timerStyle(): string {
    const pct = (this.secondsLeft / 60) * 100;
    return `conic-gradient(#f5a623 ${pct}%, #333 ${pct}%)`;
  }

  get timerColor(): string {
    if (this.secondsLeft > 30) return '#35c498';
    if (this.secondsLeft > 10) return '#f5a623';
    return '#ef5350';
  }

  async downloadQr(): Promise<void> {
    if (!this.qrImage) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const captureArea = document.querySelector('.qr-page') as HTMLElement;
      if (!captureArea) return;

      // 1. Obtener referencias y guardar estilos originales de visualización
      const timerRing = document.querySelector('.timer-ring') as HTMLElement;
      const timerText = document.querySelector('.timer-text') as HTMLElement;
      const actions = document.querySelector('.qr-actions') as HTMLElement;

      const originalRingDisplay = timerRing ? timerRing.style.display : '';
      const originalTextDisplay = timerText ? timerText.style.display : '';
      const originalActionsDisplay = actions ? actions.style.display : '';

      // 2. Ocultar físicamente los elementos del flujo para obligar al navegador a recalcular las alturas
      if (timerRing) timerRing.style.display = 'none';
      if (timerText) timerText.style.display = 'none';
      if (actions) actions.style.display = 'none';

      // Esperar un frame de animación para asegurar que el navegador aplique el reflow del layout
      await new Promise(resolve => requestAnimationFrame(resolve));

      // 3. Generar la captura con html2canvas
      const canvas = await html2canvas(captureArea, {
        backgroundColor: '#1b1b1b',
        scale: 2, // Imagen nítida de alta resolución
        logging: false,
        useCORS: true
      });

      // 4. Restaurar los estilos originales en el DOM de inmediato
      if (timerRing) timerRing.style.display = originalRingDisplay;
      if (timerText) timerText.style.display = originalTextDisplay;
      if (actions) actions.style.display = originalActionsDisplay;

      // 5. Descargar la imagen resultante
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `volticfit-acceso-${this.profile?.names || 'usuario'}.png`;
      link.click();
    } catch (err) {
      console.error('Error al generar la captura de la interfaz:', err);
      // Fallback: descargar solo la imagen del QR original si la captura falla
      const link = document.createElement('a');
      link.href = this.qrImage;
      link.download = 'volticfit-qr.png';
      link.click();
    }
  }

  private startTimer(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.secondsLeft = 60;
    this.updateDateTime();
    this.intervalId = setInterval(() => {
      this.secondsLeft -= 1;
      this.updateDateTime();
      if (this.secondsLeft <= 0) {
        this.generate();
      }
    }, 1000);
  }
}