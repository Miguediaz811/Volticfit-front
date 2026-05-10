import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Sanction } from '../../../../shared/interfaces/sanction';

@Component({
  selector: 'app-sanction-alert',
  templateUrl: './sanction-alert.component.html',
  styleUrl: './sanction-alert.component.scss'
})
export class SanctionAlertComponent implements OnInit {

  /**
   * Si se pasa usuarioId se consultan las sanciones de ese usuario específico (uso admin).
   * Si no se pasa, el interceptor JWT envía el token y el backend devuelve
   * las sanciones del usuario autenticado.
   */
  @Input() usuarioId?: number;

  tieneBloqueo = false;
  sancionActiva: Sanction | null = null;
  cargando = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // GET /api/sanctions — el backend ya filtra por rol:
    // ADMIN ve todas, el usuario autenticado ve solo las propias.
    this.http.get<Sanction[]>('http://localhost:9090/api/sanctions').subscribe({
      next: (sanciones) => {
        const hoy = new Date();
        // Una sanción bloquea si está activa (state=true) y la fecha fin no ha pasado
        const activa = sanciones.find(s =>
          s.state === true &&
          s.endDate !== null &&
          new Date(s.endDate) >= hoy
        ) ?? null;

        this.sancionActiva = activa;
        this.tieneBloqueo  = activa !== null;
        this.cargando      = false;
      },
      error: () => {
        // Si no hay sanciones el backend devuelve 404 con mensaje, no es un error real
        this.tieneBloqueo = false;
        this.cargando     = false;
      }
    });
  }
}