import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginUsuario } from '../models/login-usuario';
import { JwtDTO } from '../models/jwt-dto';
import { timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Apunta a la misma URL que probaron en Postman
  private authURL = 'http://localhost:8080/api/auth/';

  constructor(private httpClient: HttpClient) {}

  public login(loginUsuario: LoginUsuario): Observable<JwtDTO> {
    return this.httpClient.post<JwtDTO>(this.authURL + 'login', loginUsuario).pipe(
      timeout(5000), // Cancela la petición si tarda más de 5 segundos
    );
  }

  public registro(nuevoUsuario: any): Observable<any> {
    return this.httpClient.post<any>(this.authURL + 'registro', nuevoUsuario);
  }
}
