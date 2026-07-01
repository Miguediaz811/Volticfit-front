import { AbstractControl, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(
  passwordField = 'nuevaContrasena',
  confirmPasswordField = 'confirmarContrasena',
): ValidatorFn {
  return (group: AbstractControl) => {
    const passwordControl = group.get(passwordField);
    const confirmControl = group.get(confirmPasswordField);

    if (!passwordControl || !confirmControl) {
      return null;
    }

    const password = passwordControl.value;
    const confirmPassword = confirmControl.value;
    const errors = confirmControl.errors || {};

    if (!confirmPassword || password === confirmPassword) {
      if (errors['passwordMismatch']) {
        delete errors['passwordMismatch'];
        confirmControl.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }

    confirmControl.setErrors({ ...errors, passwordMismatch: true });
    return { passwordMismatch: true };
  };
}
