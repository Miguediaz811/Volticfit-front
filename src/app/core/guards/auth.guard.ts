import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Ejemplo de uso en routing: data: { roles: ['admin'] }
  const rolesRequeridos: string[] = route.data['roles'];
  if (rolesRequeridos && rolesRequeridos.length > 0) {
    const rol = auth.getRol();
    const rolesNormalizados = rolesRequeridos.map(role => role.toLowerCase().replace(/^role_/, ''));
    if (!rol || !rolesNormalizados.includes(rol)) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};
