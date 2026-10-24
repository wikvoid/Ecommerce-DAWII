import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ItemCarritoDTO {
  productoId: number;
  cantidad: number;
}

export interface NuevaOrdenDTO {
  usuarioId: number;
  items: ItemCarritoDTO[];
  tipoComprobante?: string;
  nombreCliente?: string;
  documentoCliente?: string;
  canal?: string;
  metodoPago?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/ordenes';

  // 1. Crear una nueva orden (Checkout)
  crearOrden(orden: NuevaOrdenDTO): Observable<any> {
    return this.http.post<any>(this.apiUrl, orden);
  }

  // 2. ADMIN/VENTAS: Listar TODAS las órdenes (Historial completo para tu panel)
  obtenerTodasLasOrdenes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/todas`);
  }

  // 3. ALMACÉN/VENDEDOR: Listar SOLO las órdenes pendientes (Cola de trabajo)
  obtenerOrdenesPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendientes`);
  }

  // 4. ADMIN/VENDEDOR: Actualizar el estado del pedido (CONFIRMADO, PREPARANDO, etc.)
  actualizarEstadoOrden(ordenId: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${ordenId}/estado?estado=${estado}`, {});
  }

  // 5. CLIENTE/ADMIN: Obtener detalles de una orden específica por ID (Pantalla de Confirmación)
  obtenerOrdenPorId(ordenId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${ordenId}`);
  }
}
