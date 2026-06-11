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
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  sesionExpirada = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private inactivityService: InactivityService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.pattern(RegexPatterns.email)]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sesionExpirada = params['razon'] === 'inactividad';
    });
  }

  get correo() { return this.form.get('correo')!; }
  get contrasena() { return this.form.get('contrasena')!; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading = true;
    this.errorMessage = '';
    this.sesionExpirada = false;

    const loginData: LoginRequest = {
      email: this.form.value.correo,
      password: this.form.value.contrasena,
    };

    this.authService.login(loginData).subscribe({
      next: () => {
        this.inactivityService.iniciar();
        const rol = this.authService.getRol();
        const target = rol === 'admin' ? '/admin' : '/dashboard';
        this.router.navigate([target]);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = this.serverMessage(err, 'Ocurrió un error. Intente nuevamente.');
      }
    });
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;
    const normalized = String(message || '').toLowerCase();

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    if (
      normalized.includes('unable to acquire jdbc connection') ||
      normalized.includes('communications link failure') ||
      normalized.includes('driver has not received any packets') ||
      normalized.includes('connection refused') ||
      normalized.includes('cannot connect')
    ) {
      return 'No se pudo conectar con la base de datos. Verifica que MySQL este encendido y que la configuracion de conexion sea correcta.';
    }

    return message || fallback;
  }
}
