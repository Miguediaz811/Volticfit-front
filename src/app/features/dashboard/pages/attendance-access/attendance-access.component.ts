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
        this.result = result;
        this.loading = false;
        this.stopScanner();
        this.form.reset();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo validar el código QR.');
        this.loading = false;
      },
    });
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
