import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';
import { passwordMatchValidator } from '../../../../shared/validators/password-match.validator';

// El backend expone 2 endpoints públicos para recuperación:
// 1. POST /auth/forgot-password     → genera y envía el código al correo
// 2. POST /auth/recovery/reset      → verifica el código y cambia la contraseña
// No existe /auth/recovery/verify como endpoint; la verificación es interna en el paso 2.
type Paso = 'email' | 'codigoYContrasena';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {

  paso: Paso = 'email';

  emailForm: FormGroup;
  resetForm: FormGroup;

  mensajeError      = '';
  mostrarContrasena = false;
  emailGuardado     = '';

  constructor(
    private fb:          FormBuilder,
    private authService: AuthService,
    private router:      Router
  ) {
    this.emailForm = this.fb.group({
      correo: ['', [Validators.required, Validators.pattern(RegexPatterns.email)]],
    });

    this.resetForm = this.fb.group({
      codigo:              ['', [Validators.required]],
      nuevaContrasena:     ['', [Validators.required, Validators.minLength(8), Validators.pattern(RegexPatterns.passwordVoltic)]],
      confirmarContrasena: ['', [Validators.required]],
    }, { validators: passwordMatchValidator() });
  }

  get correo()              { return this.emailForm.get('correo')!; }
  get codigo()              { return this.resetForm.get('codigo')!; }
  get nuevaContrasena()     { return this.resetForm.get('nuevaContrasena')!; }
  get confirmarContrasena() { return this.resetForm.get('confirmarContrasena')!; }

  toggleContrasena() { this.mostrarContrasena = !this.mostrarContrasena; }

  // Paso 1: enviar código al correo
  enviarEmail(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }

    this.mensajeError  = '';
    this.emailGuardado = this.emailForm.value.correo;

    this.authService.forgotPassword({ email: this.emailGuardado }).subscribe({
      next:  () => { this.paso = 'codigoYContrasena'; },
      error: (err: any) => { this.mensajeError = err.error?.message || 'tu correo no está registrado'; },
    });
  }

  // Paso 2: verificar código y restablecer contraseña
  restablecerContrasena(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }

    this.mensajeError = '';

    this.authService.restorePassword({
      email:       this.emailGuardado,
      code:        this.resetForm.value.codigo,
      newPassword: this.resetForm.value.nuevaContrasena,
    }).subscribe({
      next: () => { this.router.navigate(['/auth/login']); },
      error: (err: any) => {
        const msg: string = (err.error?.message ?? '').toLowerCase();
        if (msg.includes('código') || msg.includes('válido') || msg.includes('expirado')) {
          this.mensajeError = 'El código es inválido o ha expirado.';
        } else {
          this.mensajeError = 'No se pudo restablecer la contraseña. Intente de nuevo.';
        }
      },
    });
  }
}