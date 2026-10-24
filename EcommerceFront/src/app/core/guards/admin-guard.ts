import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // 1. Buscamos en el Session Storage con la llave exacta de tu captura
  const token = sessionStorage.getItem('AuthToken');

  if (!token) {
    console.warn('Acceso denegado: No hay sesión activa.');
    router.navigate(['/']);
    return false;
  }

  try {
    // 2. Magia para abrir el JWT: Extraemos el "Payload" (la parte central del token)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64)); // Lo convertimos en un objeto JavaScript

    // Esto imprimirá en consola t.odo lo que Spring Boot guardó sobre ti (ID, correo, roles, etc.)
    console.log('Datos descifrados del Token:', payload);

    // 3. Convertimos t.odo a texto para buscar la palabra ADMIN sin importar cómo se llame el arreglo
    const payloadString = JSON.stringify(payload).toUpperCase();

    // Validamos si tienes los permisos
    if (payloadString.includes('ADMIN') || payloadString.includes('ALMACEN')) {
      return true; // ¡Bienvenido al panel, Administrador!
    } else {
      console.warn('Acceso denegado: No tienes rol de administrador.');
      router.navigate(['/']);
      return false;
    }
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    router.navigate(['/']);
    return false;
  }
};
