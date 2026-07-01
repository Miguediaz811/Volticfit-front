import { environment } from '../../../../../environments/environment';
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
  usuarioPerfil: UsuarioPerfil | null = null;

  emailIngresado        = '';
  confirmacionIngresada = '';
  emailTouched          = false;
  confirmTouched        = false;

  constructor(
    private http:              HttpClient,
    private authService:       AuthService,
    private inactivityService: InactivityService,
    private router:            Router
  ) {}

  ngOnInit(): void {
    this.http.get<UsuarioPerfil>(`${environment.apiUrl}/auth/usuarios/me`).subscribe({
      next:  perfil => {
        this.usuarioId    = perfil.idUser;
        this.usuarioPerfil = perfil;
      },
      error: () => { this.errorMessage = 'No se pudo cargar el perfil del usuario.'; }
    });
  }

  get emailValido(): boolean {
    return this.emailIngresado.trim().toLowerCase() === (this.usuarioPerfil?.email || '').toLowerCase();
  }

  get confirmValido(): boolean {
    return this.confirmacionIngresada.trim() === 'INACTIVAR';
  }

  puedeConfirmar(): boolean {
    return this.emailValido && this.confirmValido;
  }

  onEmailChange(): void   { this.emailTouched   = true; }
  onConfirmChange(): void { this.confirmTouched  = true; }

  abrirModal(): void {
    this.errorMessage         = '';
    this.emailIngresado       = '';
    this.confirmacionIngresada = '';
    this.emailTouched         = false;
    this.confirmTouched       = false;
    this.mostrarModal         = true;
  }

  cancelar(): void {
    this.mostrarModal = false;
  }

  confirmarInactivar(): void {
    this.emailTouched   = true;
    this.confirmTouched = true;

    if (!this.puedeConfirmar()) return;

    if (!this.usuarioId) {
      this.errorMessage = 'No se pudo identificar el usuario.';
      return;
    }

    this.cargando     = true;
    this.errorMessage = '';

    this.http.put<MessageResponse>(`${environment.apiUrl}/auth/usuarios/${this.usuarioId}/inactivar`, {})
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
