import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../interfaces/register-request';
import { passwordMatchValidator } from '../../../../shared/validators/password-match.validator';
import { RegisterResponse } from '../../interfaces/register-response';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.scss'
})
export class RegisterComponent implements OnInit {

  form!: FormGroup;

  documentTypes: string[] = ['CC', 'CE', 'TI', 'PAS', 'NIT'];

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

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
    }, {
      validators: passwordMatchValidator()
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      this.successMessage = '';
      this.errorMessage = '';

      const { firstName, lastName, documentType, documentNumber, email, phone, password } = this.form.value;

      const registerData: RegisterRequest = {
        names:    firstName,
        surnames: lastName,
        docType:  documentType,
        docNum:   documentNumber,
        email:    email,
        phone:    phone,
        password: password,
      };

      this.authService.register(registerData).subscribe({
        next: (response: RegisterResponse) => {
          this.loading = false;
          this.successMessage = response.message;
          this.form.reset();
          this.form.markAsPristine();
          this.form.markAsUntouched();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message;
        }
      });

    } else {
      this.markAllAsTouched();
    }
  }

  private markAllAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  hasUppercase(): boolean {
    const value = this.form.get('password')?.value || '';
    return /[A-Z]/.test(value);
  }

  hasNumber(): boolean {
    const value = this.form.get('password')?.value || '';
    return /\d/.test(value);
  }

  hasSpecialChar(): boolean {
    const value = this.form.get('password')?.value || '';
    return /[@$!%*?&.#_-]/.test(value);
  }

  hasMinLength(): boolean {
    const value = this.form.get('password')?.value || '';
    return value.length >= 8;
  }
}
