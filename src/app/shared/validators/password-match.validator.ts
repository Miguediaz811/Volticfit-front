import { AbstractControl, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl) => {
    const nueva     = group.get('nuevaContrasena')?.value;
    const confirmar = group.get('confirmarContrasena')?.value;
    return nueva === confirmar ? null : { passwordMismatch: true };
  };
}