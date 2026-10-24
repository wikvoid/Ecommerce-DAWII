import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// CanActivateFn es el tipo que Angular usa para funciones que deciden si una ruta se puede activar
export const authGuard: CanActivateFn = (route, state) => {
  // inject() es la forma moderna de inyectar servicios en funciones standalone
  const router = inject(Router);

  // Verificamos si existe el pase de acceso en la memoria del navegador
  const token = sessionStorage.getItem('AuthToken');

  if (token) {
    // Si hay token, retornamos true. Las puertas se abren y el usuario ve la pantalla.
    return true;
  } else {
    // Si no hay token, lo pateamos a la pantalla de login.
    router.navigate(['/login']);
    // Retornamos false para cancelar la navegación a la ruta prohibida.
    return false;
  }
};
