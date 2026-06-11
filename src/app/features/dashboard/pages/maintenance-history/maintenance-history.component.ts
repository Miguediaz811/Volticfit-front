import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { MachineItem, MaintenanceItem } from '../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-maintenance-history',
  templateUrl: './maintenance-history.component.html',
  styleUrl: './maintenance-history.component.scss',
})
export class MaintenanceHistoryComponent implements OnInit {
  items: MaintenanceItem[] = [];
  filteredItems: MaintenanceItem[] = [];
  machines: MachineItem[] = [];
  loading = false;
  saving = false;
  message = '';
  error = '';
  searchTerm = '';
  readonly minDate = new Date().toISOString().slice(0, 10);

  form = this.fb.group({
    machineId: ['', [Validators.required]],
    type: ['Preventivo', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    date: [this.minDate, [Validators.required]],
    responsible: ['', [Validators.required]],
  });

  constructor(private api: DashboardApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadMachines();
    this.loadHistory();
  }

  loadMachines(): void {
    this.api.getMachines().subscribe({
      next: machines => {
        this.machines = machines.filter(m => {
          if (!m.name) return false;
          const normalized = m.name.trim().toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '');
          return normalized !== 'sin maquina';
        });
      },
      error: () => { this.machines = []; },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const date = this.form.value.date || '';
    if (date < this.minDate) {
      this.error = 'Selecciona una fecha desde hoy en adelante.';
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';
    this.api.scheduleMaintenance({
      machineId: Number(this.form.value.machineId),
      type: this.form.value.type || 'Preventivo',
      description: this.form.value.description || '',
      date,
      responsible: this.form.value.responsible || '',
    }).subscribe({
      next: response => {
        if (response.status === 'ERROR') {
          this.error = response.message || 'No se pudo registrar el mantenimiento.';
        } else {
          this.message = response.message || 'Mantenimiento registrado correctamente.';
          this.form.reset({ machineId: '', type: 'Preventivo', description: '', date: this.minDate, responsible: '' });
          this.loadHistory();
        }
        this.saving = false;
      },
      error: err => {
        this.error = err?.error?.message || err?.message || 'No se pudo registrar el mantenimiento.';
        this.saving = false;
      },
    });
  }

  loadHistory(): void {
    this.loading = true;
    this.error = '';
    this.api.getMaintenanceHistory().subscribe({
      next: items => {
        const today = new Date().toISOString().slice(0, 10);
        this.items = items.map(item => ({
          ...item,
          state: item.state === false ? false : (item.date && item.date <= today ? false : true),
        }));
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || err?.message || 'No se pudo cargar la informacion de mantenimiento.';
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    const term = this.normalize(this.searchTerm);
    this.filteredItems = !term
      ? this.items
      : this.items.filter(item => this.normalize([
        item.machine?.name,
        item.machine?.type,
        item.description,
        item.responsible,
        item.date,
      ].join(' ')).includes(term));
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}