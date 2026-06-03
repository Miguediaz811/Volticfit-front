import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { MachineItem } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-machines',
  templateUrl: './machines.component.html',
  styleUrl: './machines.component.scss',
})
export class MachinesComponent implements OnInit {
  machines: MachineItem[] = [];
  loading = false;
  saving = false;
  message = '';
  error = '';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['', [Validators.required]],
    state: [true, [Validators.required]],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService) {}

  ngOnInit(): void {
    this.loadMachines();
  }

  loadMachines(): void {
    this.loading = true;
    this.error = '';

    this.api.getMachines().subscribe({
      next: machines => {
        this.machines = machines;
        this.loading = false;
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo cargar el listado de máquinas.');
        this.loading = false;
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';

    this.api.createMachine({
      name: this.form.value.name || '',
      type: this.form.value.type || '',
      state: this.form.value.state ?? true,
    }).subscribe({
      next: response => {
        if (response.status === 'ERROR') {
          this.error = response.message || 'No se pudo registrar la máquina.';
        } else {
          this.message = response.message || 'Máquina registrada correctamente.';
          this.form.reset({ name: '', type: '', state: true });
          this.loadMachines();
        }
        this.saving = false;
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo registrar la máquina.');
        this.saving = false;
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
