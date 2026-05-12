import { Inject, Injectable, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {

  private readonly TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly EVENTOS = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'];
  private boundReset = this.resetTimer.bind(this);

  constructor(
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /** Llamar justo después del login exitoso */
  iniciar(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => {
      this.EVENTOS.forEach(ev => window.addEventListener(ev, this.boundReset, { passive: true }));
      this.resetTimer();
    });
  }

  /** Llamar al hacer logout o al inactivar la cuenta */
  detener(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.EVENTOS.forEach(ev => window.removeEventListener(ev, this.boundReset));
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  private resetTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.ngZone.run(() => {
        this.detener();
        this.auth.removeToken();
        this.router.navigate(['/auth/login'], { queryParams: { razon: 'inactividad' } });
      });
    }, this.TIMEOUT_MS);
  }

  ngOnDestroy(): void { this.detener(); }
}