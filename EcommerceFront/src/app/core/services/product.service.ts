import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductoDTO {
  nombre: string;
  marca: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  categoriaId: number;
  especificaciones: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/productos';

  // PÚBLICO: Obtener todos los productos activos para Home y Catálogo
  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // PÚBLICO: Barra de búsqueda por término (?termino=...)
  buscarProductos(termino: string): Observable<any[]> {
    const params = new HttpParams().set('termino', termino);
    return this.http.get<any[]>(`${this.apiUrl}/buscar`, { params });
  }

  // PÚBLICO / ADMIN: Obtener detalle de un producto por ID
  obtenerProductoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ADMIN / ALMACÉN: Crear nuevo producto con Imagen (FormData)
  crearProducto(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  // ADMIN / ALMACÉN: Actualizar producto existente con Imagen (FormData)
  actualizarProducto(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData);
  }

  // ADMIN / ALMACÉN: Eliminación lógica (desactivar producto)
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
