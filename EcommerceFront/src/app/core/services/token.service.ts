import { Injectable } from '@angular/core';

const TOKEN_KEY = 'AuthToken';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor() {}

  // 1. Guarda el token cuando el usuario hace Login
  public setToken(token: string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }

  // 2. Obtiene el token para que el AuthInterceptor lo inyecte en las peticiones
  public getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  // 3. Verifica rápidamente si hay una sesión activa
  public isLogged(): boolean {
    return this.getToken() !== null;
  }

  // 4. Cierra la sesión borrando la memoria
  public logOut(): void {
    window.sessionStorage.clear();
  }

  // --- MAGIA DE JWT ---
  // Un JWT tiene 3 partes separadas por puntos (Header.Payload.Signature).
  // La segunda parte (Payload) contiene la información del usuario en Base64.
  private decodePayload(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payloadBase64Url = token.split('.')[1];
      // Convertimos Base64Url a Base64 normal
      const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/, '/');
      const decodedJson = atob(payloadBase64);
      return JSON.parse(decodedJson);
    } catch (e) {
      console.error('Error al decodificar el token', e);
      return null;
    }
  }

  // 5. Extrae el correo/username del token (Normalmente viaja en el claim 'sub' de Spring Security)
  public getUserName(): string {
    const payload = this.decodePayload();
    return payload?.sub || 'Cliente';
  }

  // 6. Extrae el ID del usuario REAL para enviar la orden de compra.
  public getUserId(): number | null {
    const payload = this.decodePayload();
    // Ahora retorna el ID que viene de Spring Boot, o null si falla
    return payload?.id || null;
  }

  public getUserEmail(): string | null {
    const payload = this.decodePayload();
    // Siguradoen a ti 'email' ket ti umno a claim sadiay token-mo
    return payload?.email || null;
  }

  public getFullName(): string {
    const payload = this.decodePayload();
    // Lee el nuevo claim "nombreCompleto"
    return payload?.nombreCompleto || 'Cliente';
  }

  // Añade este méto.do al final de tu TokenService
  public isAdmin(): boolean {
    const payload = this.decodePayload();
    if (!payload || !payload.roles) return false;

    // Convertimos a texto para buscar los roles de empleado
    const roles = JSON.stringify(payload.roles).toUpperCase();
    return roles.includes('ADMIN') || roles.includes('VENDEDOR') || roles.includes('ALMACEN');
  }
}
