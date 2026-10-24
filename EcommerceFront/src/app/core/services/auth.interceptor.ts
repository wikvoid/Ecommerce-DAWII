import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Leemos el token directamente del almacenamiento del navegador
  const token = sessionStorage.getItem('AuthToken');

  if (token) {
    // Las peticiones HTTP en Angular son inmutables.
    // Clonamos la petición original y le agregamos la cabecera de seguridad.
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(authReq);
  }

  // Si no hay token (ej. cuando recién intentan hacer login), la petición pasa limpia
  return next(req);
};
