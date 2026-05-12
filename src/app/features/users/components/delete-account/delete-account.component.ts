import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InactivityService } from '../../../../core/services/inactivity.service';
import { MessageResponse } from '../../../../shared/interfaces/message-response';

interface UsuarioPerfil {
  idUser: number;
  names:  string;
  email:  string;
}

@Component({
  selector: 'app-delete-account',
  templateUrl: './delete-account.component.html',
  styleUrl: './delete-account.component.scss'
})
export class DeleteAccountComponent implements OnInit {

  mostrarModal  = false;
  cargando      = false;
  errorMessage  = '';
  usuarioId: number | null = null;

  constructor(
    private http:              HttpClient,
    private authService:       AuthService,
    private inactivityService: InactivityService,
    private router:            Router
  ) {}

  ngOnInit(): void {
    this.http.get<UsuarioPerfil>('http://localhost:9090/auth/usuarios/me').subscribe({
      next:  perfil => { this.usuarioId = perfil.idUser; },
      error: ()     => { this.errorMessage = 'No se pudo cargar el perfil del usuario.'; }
    });
  }

  abrirModal(): void {
    this.errorMessage = '';
    this.mostrarModal = true;
  }

  cancelar(): void {
    this.mostrarModal = false;
  }

  confirmarInactivar(): void {
    if (!this.usuarioId) {
      this.errorMessage = 'No se pudo identificar el usuario.';
      return;
    }

    this.cargando     = true;
    this.errorMessage = '';

    this.http.put<MessageResponse>(`http://localhost:9090/auth/usuarios/${this.usuarioId}/inactivar`, {})
      .subscribe({
        next: () => {
          this.cargando     = false;
          this.mostrarModal = false;
          this.inactivityService.detener();
          this.authService.removeToken();
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.cargando     = false;
          this.errorMessage = 'No se pudo inactivar la cuenta. Intente de nuevo.';
        }
      });
  }
}