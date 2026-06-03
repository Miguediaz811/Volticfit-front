import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../../../shared/interfaces/register-request';
import { RegisterResponse } from '../../../../shared/interfaces/register-response';
import { passwordMatchValidator } from '../../../../shared/validators/password-match.validator';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.scss'
})
export class RegisterComponent implements OnInit {

  form!: FormGroup;
  documentTypes: string[] = ['CC', 'CE', 'TI', 'PAS', 'NIT'];
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(60),
        Validators.pattern(RegexPatterns.onlyLetters)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(60),
        Validators.pattern(RegexPatterns.onlyLetters)
      ]],
      documentType: ['', Validators.required],
      documentNumber: ['', [
        Validators.required,
        Validators.pattern(RegexPatterns.documentNumber)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(RegexPatterns.email)
      ]],
      phone: ['', [
        Validators.required,
        Validators.pattern(RegexPatterns.phone)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(RegexPatterns.passwordVoltic)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator('password', 'confirmPassword') });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.markAllAsTouched(); return; }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const { firstName, lastName, documentType, documentNumber, email, phone, password } = this.form.value;

    const registerData: RegisterRequest = {
      names: firstName,
      surnames: lastName,
      docType: documentType,
      docNum: documentNumber,
      email,
      phone,
      password,
    };

    this.authService.register(registerData).subscribe({
      next: (response: RegisterResponse) => {
        this.loading = false;
        this.successMessage = response.message || '';
        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = this.serverMessage(err, 'Ocurrió un error al registrarse. Intente nuevamente.');
      }
    });
  }

  private markAllAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => this.form.get(key)?.markAsTouched());
  }

  hasUppercase(): boolean { return /[A-Z]/.test(this.form.get('password')?.value || ''); }
  hasNumber(): boolean { return /\d/.test(this.form.get('password')?.value || ''); }
  hasSpecialChar(): boolean { return /[@$!%*?&.#_-]/.test(this.form.get('password')?.value || ''); }
  hasMinLength(): boolean { return (this.form.get('password')?.value || '').length >= 8; }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
