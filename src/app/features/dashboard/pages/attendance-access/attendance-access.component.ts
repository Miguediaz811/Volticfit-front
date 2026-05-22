import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { AttendanceResult } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-attendance-access',
  templateUrl: './attendance-access.component.html',
  styleUrl: './attendance-access.component.scss',
})
export class AttendanceAccessComponent implements OnDestroy {
  @ViewChild('videoPreview') videoPreview?: ElementRef<HTMLVideoElement>;

  result: AttendanceResult | null = null;
  loading = false;
  scanning = false;
  error = '';
  private readonly scanner = new BrowserQRCodeReader();
  private scannerControls?: IScannerControls;

  readonly form = this.fb.group({
    token: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService) {}

  ngOnDestroy(): void {
    this.stopScanner();
  }

  async startScanner(): Promise<void> {
    this.error = '';
    this.result = null;

    if (!this.videoPreview) {
      this.error = 'No se pudo inicializar la camara.';
      return;
    }

    try {
      this.scanning = true;
      this.scannerControls = await this.scanner.decodeFromVideoDevice(
        undefined,
        this.videoPreview.nativeElement,
        (scanResult) => {
          const token = scanResult?.getText();
          if (!token) return;
          this.form.patchValue({ token });
          this.stopScanner();
          this.submit();
        },
      );
    } catch {
      this.scanning = false;
      this.error = 'No se pudo acceder a la camara para escanear el QR.';
    }
  }

  stopScanner(): void {
    this.scannerControls?.stop();
    this.scannerControls = undefined;
    this.scanning = false;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.result = null;

    this.api.scanQr(this.form.value.token || '').subscribe({
      next: result => {
        this.result = { ...result, message: this.friendlyMessage(result.message, 'Asistencia registrada correctamente.') };
        this.loading = false;
        this.stopScanner();
        this.form.reset();
      },
      error: err => {
        this.error = this.friendlyMessage(err.error?.message, 'No se pudo validar el codigo QR.');
        this.loading = false;
      },
    });
  }

  private friendlyMessage(message: string | undefined, fallback: string): string {
    const text = (message || '').toLowerCase();
    if (!text) return fallback;
    if (text.includes('invalid') || text.includes('no es valido')) {
      return 'El codigo QR no es valido.';
    }
    if (text.includes('already') || text.includes('utilizado')) {
      return 'Este codigo QR ya fue utilizado.';
    }
    if (text.includes('blocked') || text.includes('sancion')) {
      return 'Acceso bloqueado por sancion activa.';
    }
    if (text.includes('entry') || text.includes('entrada')) {
      return 'Entrada registrada correctamente.';
    }
    if (text.includes('exit') || text.includes('salida')) {
      return 'Salida registrada correctamente.';
    }
    return message || fallback;
  }
}
