import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InactivityService } from '../../../../core/services/inactivity.service';
import { LoginRequest } from '../../../../shared/interfaces/auth.interface';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {

  form: FormGroup;
  isLoading      = false;
  errorMessage   = '';
  showPassword   = false;
  sesionExpirada = false;

  constructor(
    private fb:                FormBuilder,
    private authService:       AuthService,
    private inactivityService: InactivityService,
    private router:            Router,
    private route:             ActivatedRoute
  ) {
    this.form = this.fb.group({
      correo:     ['', [Validators.required, Validators.pattern(RegexPatterns.email)]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sesionExpirada = params['razon'] === 'inactividad';
    });
  }

  get correo()     { return this.form.get('correo')!; }
  get contrasena() { return this.form.get('contrasena')!; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading      = true;
    this.errorMessage   = '';
    this.sesionExpirada = false;

    const loginData: LoginRequest = {
      email:    this.form.value.correo,
      password: this.form.value.contrasena,
    };

    this.authService.login(loginData).subscribe({
      next: () => {
        this.inactivityService.iniciar();
        const rol = this.authService.getRol();
        if (rol === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg: string = (err.error?.message ?? '').toLowerCase();

        if (msg.includes('inactive')) {
          this.errorMessage = 'Tu cuenta está inactiva. Contacta al administrador.';
        } else if (msg.includes('contraseña incorrecta')) {
          this.errorMessage = 'La contraseña es incorrecta.';
        } else if (msg.includes('usuario no encontrado')) {
          this.errorMessage = 'No existe una cuenta con ese correo.';
        } else {
          this.errorMessage = 'Ocurrió un error. Intente nuevamente.';
        }
      }
    });
  }
}