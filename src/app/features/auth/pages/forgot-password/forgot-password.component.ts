import { Component } from '@angular/core';
import {FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';
import { passwordMatchValidator } from '../../../../shared/validators/password-match.validator';


type Paso = 'email' | 'codigo' | 'nuevaContrasena';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {

  paso: Paso = 'email';

  emailForm:    FormGroup;
  codigoForm:   FormGroup;
  passwordForm: FormGroup;

  mensajeError      = '';
  mostrarContrasena = false;

  private emailGuardado = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      correo: ['', [Validators.required, Validators.pattern(RegexPatterns.email)]],
    });

    this.codigoForm = this.fb.group({
      codigo: ['', [Validators.required]],
    });

    this.passwordForm = this.fb.group({
      nuevaContrasena:     ['', [Validators.required, Validators.minLength(8), Validators.pattern(RegexPatterns.passwordVoltic)]],
      confirmarContrasena: ['', [Validators.required]],
    }, { validators: passwordMatchValidator() });
  }

  get correo()             { return this.emailForm.get('correo')!; }
  get codigo()             { return this.codigoForm.get('codigo')!; }
  get nuevaContrasena()    { return this.passwordForm.get('nuevaContrasena')!; }
  get confirmarContrasena(){ return this.passwordForm.get('confirmarContrasena')!; }

  toggleContrasena() { this.mostrarContrasena = !this.mostrarContrasena; }

  enviarEmail(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }

    this.mensajeError  = '';
    this.emailGuardado = this.emailForm.value.correo;

    this.authService.forgotPassword({ email: this.emailGuardado }).subscribe({
      next: () => { this.paso = 'codigo'; },
      error: (err) => { this.mensajeError = err.error?.message || 'Error al enviar el correo.'; },
    });
  }

  verificarCodigo(): void {
    if (this.codigoForm.invalid) { this.codigoForm.markAllAsTouched(); return; }

    this.mensajeError = '';

    this.authService.verifyCode({
      email: this.emailGuardado,
      token: this.codigoForm.value.codigo,
    }).subscribe({
      next: () => { this.paso = 'nuevaContrasena'; },
      error: (err) => { this.mensajeError = err.error?.message || 'Código inválido o expirado.'; },
    });
  }

  restablecerContrasena(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }

    this.mensajeError = '';

    this.authService.restorePassword({
      email:       this.emailGuardado,
      newPassword: this.passwordForm.value.nuevaContrasena,
    }).subscribe({
      next: () => { this.router.navigate(['/auth/login']); },
      error: (err) => { this.mensajeError = err.error?.message || 'Error al restablecer la contraseña.'; },
    });
  }
}