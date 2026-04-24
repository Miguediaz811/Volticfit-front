import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {

  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  get correo() { return this.form.get('correo')!; }
  get contrasena() { return this.form.get('contrasena')!; }

  togglePassword() { this.showPassword = !this.showPassword; }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.http.post<{ jwt: string }>('http://localhost:9090/auth/login', this.form.value)
      .subscribe({
        next: (res: { jwt: string }) => {
          localStorage.setItem('token', res.jwt);
          console.log('Inicio de sesión exitoso:', res);
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.errorMessage = err.error?.error || 'Credenciales incorrectas';
          this.isLoading = false;
        }
      });
  }
}