import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../interfaces/auth.interface';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
})
export class LoginComponent {

  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      correo:     ['', [Validators.required, Validators.pattern(RegexPatterns.email)]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  get correo()     { return this.form.get('correo')!; }
  get contrasena() { return this.form.get('contrasena')!; }

  togglePassword() { this.showPassword = !this.showPassword; }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      email:    this.form.value.correo,
      password: this.form.value.contrasena,
    };

    this.authService.login(loginData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Credenciales incorrectas';
        this.isLoading = false;
      }
    });
  }
}