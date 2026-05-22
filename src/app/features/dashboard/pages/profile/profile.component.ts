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
    names: ['', [Validators.required, Validators.minLength(2)]],
    surnames: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
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
    this.message = '';
    this.error = '';
  }

  cancelEditing(): void {
    if (this.profile) {
      this.patchForm(this.profile);
    }
    this.editing = false;
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
      phone: values.phone || '',
      docType: this.profile.docType || '',
      docNumber: this.profile.docNumber || this.profile.docNum || '',
    }).subscribe({
      next: response => {
        this.message = response.message || 'Perfil actualizado.';
        this.editing = false;
        this.saving = false;
        this.loadProfile();
      },
      error: err => {
        this.error = this.friendlyMessage(err.error?.message, 'No se pudieron guardar los cambios.');
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
        this.passwordMessage = response.message || 'Contrasena actualizada.';
        this.passwordForm.reset();
        this.changingPassword = false;
      },
      error: err => {
        const message = String(err.error?.message || '').toLowerCase();
        this.passwordError = message.includes('incorrect')
          ? 'La contrasena actual es incorrecta.'
          : 'No se pudo cambiar la contrasena.';
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
      next: () => {
        this.message = 'Cuenta inactivada correctamente.';
        this.inactivity.detener();
        this.auth.removeToken();
        this.router.navigate(['/auth/login']);
      },
      error: err => {
        this.error = this.friendlyMessage(err.error?.message, 'No se pudo inactivar la cuenta.');
        this.deactivating = false;
      },
    });
  }

  private patchForm(profile: UserProfile): void {
    this.form.patchValue({
      names: profile.names || '',
      surnames: profile.surnames || '',
      email: profile.email || '',
      phone: profile.phone || '',
    });
  }

  private friendlyMessage(message: string | undefined, fallback: string): string {
    const text = (message || '').toLowerCase();
    if (!text) return fallback;
    if (text.includes('email') || text.includes('correo')) {
      return 'Este correo ya esta registrado.';
    }
    if (text.includes('phone') || text.includes('telefono')) {
      return 'El telefono solo debe contener numeros.';
    }
    if (text.includes('permission') || text.includes('permiso')) {
      return 'No tienes permiso para realizar esta accion.';
    }
    return message || fallback;
  }
}
