import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  private emailGuardado  = '';
  private codigoGuardado = '';

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

  get correo()              { return this.emailForm.get('correo')!; }
  get codigo()              { return this.codigoForm.get('codigo')!; }
  get nuevaContrasena()     { return this.passwordForm.get('nuevaContrasena')!; }
  get confirmarContrasena() { return this.passwordForm.get('confirmarContrasena')!; }

  toggleContrasena() { this.mostrarContrasena = !this.mostrarContrasena; }

  // Paso 1: enviar correo
  enviarEmail(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }

    this.mensajeError  = '';
    this.emailGuardado = this.emailForm.value.correo;

    this.authService.forgotPassword({ email: this.emailGuardado }).subscribe({
      next: () => { this.paso = 'codigo'; },
      error: () => { this.mensajeError = 'No se encontró una cuenta con ese correo.'; },
    });
  }

  // Paso 2: verificar código
  verificarCodigo(): void {
    if (this.codigoForm.invalid) { this.codigoForm.markAllAsTouched(); return; }

    this.mensajeError  = '';
    this.codigoGuardado = this.codigoForm.value.codigo;

    this.authService.verifyCode({
      email: this.emailGuardado,
      token: this.codigoGuardado,
    }).subscribe({
      next: () => { this.paso = 'nuevaContrasena'; },
      error: () => { this.mensajeError = 'El código es inválido o ha expirado.'; },
    });
  }

  // Paso 3: establecer nueva contraseña
  restablecerContrasena(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }

    this.mensajeError = '';

    this.authService.restorePassword({
      email:       this.emailGuardado,
      code:        this.codigoGuardado,
      newPassword: this.passwordForm.value.nuevaContrasena,
    }).subscribe({
      next: () => { this.router.navigate(['/auth/login']); },
      error: () => { this.mensajeError = 'No se pudo restablecer la contraseña. Intente de nuevo.'; },
    });
  }
}