import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InactivityService } from '../../../../core/services/inactivity.service';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { UserProfile } from '../../../../shared/interfaces/dashboard.interface';
import { RegexPatterns } from '../../../../shared/validators/regex.constants';
import { passwordMatchValidator } from '../../../../shared/validators/password-match.validator';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  loading = true;
  saving = false;
  changingPassword = false;
  editing = false;
  deactivating = false;
  confirmDeactivate = false;
  message = '';
  error = '';
  passwordMessage = '';
  passwordError = '';

  readonly form = this.fb.group({
    names: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
    surnames: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    phone: [{ value: '', disabled: true }],
  });

  readonly passwordForm = this.fb.group({
    contrasenaActual: ['', [Validators.required]],
    nuevaContrasena: ['', [Validators.required, Validators.minLength(8), Validators.pattern(RegexPatterns.passwordVoltic)]],
    confirmarContrasena: ['', [Validators.required]],
  }, { validators: passwordMatchValidator() });

  constructor(
    private fb: FormBuilder,
    private api: DashboardApiService,
    private auth: AuthService,
    private inactivity: InactivityService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';

    this.api.getMe().subscribe({
      next: profile => {
        this.profile = profile;
        this.patchForm(profile);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la informacion del perfil.';
        this.loading = false;
      },
    });
  }

  roleName(): string {
    const role = this.profile?.role;
    if (!role) {
      return 'Sin rol';
    }
    return typeof role === 'string' ? role : role.name || 'Sin rol';
  }

  documentNumber(): string {
    return this.profile?.docNumber || this.profile?.docNum || '-';
  }

  startEditing(): void {
    this.editing = true;
    this.unlockProfileForm();
    this.message = '';
    this.error = '';
  }

  cancelEditing(): void {
    if (this.profile) {
      this.patchForm(this.profile);
    }
    this.editing = false;
    this.lockProfileForm();
  }

  saveProfile(): void {
    if (!this.profile?.idUser || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';
    const values = this.form.getRawValue();

    this.api.updateUser(this.profile.idUser, {
      names: values.names || '',
      surnames: values.surnames || '',
      email: values.email || '',
      phone: values.phone ? Number(values.phone) : undefined,
      docType: this.profile.docType || '',
      docNumber: this.profile.docNumber || this.profile.docNum || '',
    }).subscribe({
      next: response => {
        this.message = response.message || '';
        this.editing = false;
        this.lockProfileForm();
        this.saving = false;
        this.loadProfile();
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudieron guardar los cambios.');
        this.saving = false;
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changingPassword = true;
    this.passwordMessage = '';
    this.passwordError = '';

    this.auth.changePassword({
      currentPassword: this.passwordForm.value.contrasenaActual || '',
      newPassword: this.passwordForm.value.nuevaContrasena || '',
    }).subscribe({
      next: response => {
        this.passwordMessage = response.message || '';
        this.passwordForm.reset();
        this.changingPassword = false;
      },
      error: err => {
        this.passwordError = this.serverMessage(err, 'No se pudo cambiar la contraseña.');
        this.changingPassword = false;
      },
    });
  }

  deactivateAccount(): void {
    if (!this.profile?.idUser) {
      this.error = 'No se pudo identificar el usuario.';
      return;
    }

    this.deactivating = true;
    this.message = '';
    this.error = '';

    this.api.deactivateUser(this.profile.idUser).subscribe({
      next: response => {
        this.message = response.message || '';
        this.inactivity.detener();
        this.auth.removeToken();
        this.router.navigate(['/auth/login']);
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo inactivar la cuenta.');
        this.deactivating = false;
      },
    });
  }

  private patchForm(profile: UserProfile): void {
    this.form.patchValue({
      names: profile.names || '',
      surnames: profile.surnames || '',
      email: profile.email || '',
      phone: profile.phone ? String(profile.phone) : '',
    });
    if (!this.editing) {
      this.lockProfileForm();
    }
  }

  private lockProfileForm(): void {
    this.form.controls.names.disable();
    this.form.controls.surnames.disable();
    this.form.controls.email.disable();
    this.form.controls.phone.disable();
  }

  private unlockProfileForm(): void {
    this.form.controls.names.enable();
    this.form.controls.surnames.enable();
    this.form.controls.email.enable();
    this.form.controls.phone.enable();
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
