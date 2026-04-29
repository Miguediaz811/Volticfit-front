import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';
import { passwordMatchValidator } from '../user-register/user-register.component';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {

  formulario: FormGroup;
  mensajeExito  = '';
  mensajeError  = '';
  mostrarActual = false;
  mostrarNueva  = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.formulario = this.fb.group({
      contrasenaActual:    ['', [Validators.required]],
      nuevaContrasena:     ['', [Validators.required, Validators.minLength(8), Validators.pattern(RegexPatterns.passwordVoltic)]],
      confirmarContrasena: ['', [Validators.required]],
    }, { validators: passwordMatchValidator() });
  }

  get contrasenaActual()    { return this.formulario.get('contrasenaActual')!; }
  get nuevaContrasena()     { return this.formulario.get('nuevaContrasena')!; }
  get confirmarContrasena() { return this.formulario.get('confirmarContrasena')!; }

  toggleActual() { this.mostrarActual = !this.mostrarActual; }
  toggleNueva()  { this.mostrarNueva  = !this.mostrarNueva; }

  onSubmit(): void {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }

    this.mensajeExito = '';
    this.mensajeError = '';

    this.authService.changePassword({
      currentPassword: this.formulario.value.contrasenaActual,
      newPassword:     this.formulario.value.nuevaContrasena,
    }).subscribe({
      next: () => {
        this.mensajeExito = 'Contraseña actualizada exitosamente.';
        this.formulario.reset();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'Error al cambiar la contraseña.';
      },
    });
  }
}