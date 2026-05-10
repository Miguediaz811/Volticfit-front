import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageResponse } from '../../shared/interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly apiUrl = 'http://localhost:9090';

  constructor(private http: HttpClient) {}

  /**
   * Inactiva la cuenta del usuario.
   * Endpoint: PUT /auth/usuarios/{id}/inactivar
   * El interceptor JWT adjunta el token automáticamente.
   */
  inactivarCuenta(usuarioId: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/auth/usuarios/${usuarioId}/inactivar`, {});
  }
}