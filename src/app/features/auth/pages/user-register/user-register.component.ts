import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../interfaces/register-request';

export function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): { [key: string]: boolean } | null => {
    const password = group.get('contrasena');
    const confirmPassword = group.get('confirmarContrasena');

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.scss'
})
export class RegisterComponent implements OnInit {

  formulario!: FormGroup;

  tiposDocumento: string[] = ['CC', 'CE', 'TI', 'PAS', 'NIT'];

  mostrarContrasena: boolean = false;
  mostrarConfirmarContrasena: boolean = false;

  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      nombres: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(60),
        Validators.pattern(RegexPatterns.onlyLetters)
      ]],

      apellidos: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(60),
        Validators.pattern(RegexPatterns.onlyLetters)
      ]],

      tipo_doc: ['', Validators.required],

      num_doc: ['', [
        Validators.required,
        Validators.pattern(RegexPatterns.documentNumber)
      ]],

      correo: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(RegexPatterns.email)
      ]],

      telefono: ['', [
        Validators.required,
        Validators.pattern(RegexPatterns.phone)
      ]],

      contrasena: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(RegexPatterns.passwordVoltic)
      ]],

      confirmarContrasena: ['', [Validators.required]]
    }, {
      validators: passwordMatchValidator()
    });
  }

  onSubmit(): void {
    if (this.formulario.valid) {
      this.cargando = true;
      this.mensajeExito = '';
      this.mensajeError = '';

      const form = this.formulario.value;

      const registerData: RegisterRequest = {
        names:    form.nombres,
        surnames: form.apellidos,
        docType:  form.tipo_doc,
        docNum:   form.num_doc,
        email:    form.correo,
        phone:    form.telefono,
        password: form.contrasena,
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.cargando = false;
          this.mensajeExito = 'Usuario registrado exitosamente.';
          this.formulario.reset();
          this.formulario.markAsPristine();
          this.formulario.markAsUntouched();
        },
        error: (err) => {
          this.cargando = false;
          if (err.status === 409) {
            this.mensajeError = 'El correo ya está registrado.';
          } else {
            this.mensajeError = 'Ocurrió un error. Intente nuevamente.';
          }
        }
      });

    } else {
      this.markAllAsTouched();
    }
  }

  private markAllAsTouched(): void {
    Object.keys(this.formulario.controls).forEach(key => {
      this.formulario.get(key)?.markAsTouched();
    });
  }
}