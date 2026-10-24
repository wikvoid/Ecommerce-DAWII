import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { TokenService } from '../../core/services/token.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css'],
})
export class MyOrdersComponent implements OnInit {
  orders = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  selectedOrder = signal<any | null>(null);

  private tokenService = inject(TokenService);
  private http = inject(HttpClient);
  // Ajusta esta URL según tu controlador en Spring Boot
  private apiUrl = 'http://localhost/api/ordenes';

  ngOnInit(): void {
    this.fetchMyOrders();
  }

  fetchMyOrders(): void {
    const usuarioId = this.tokenService.getUserId(); // Ajusta según el método real de tu TokenService
    const token = this.tokenService.getToken(); // Ajusta según el método real de tu TokenService

    if (!usuarioId || !token) {
      this.isLoading.set(false);
      return;
    }

    // 1. Configuramos el Token JWT en las cabeceras
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // 2. Apuntamos al puerto 8080 (cámbialo si tu backend usa otro)
    const url = `http://localhost:8080/api/ordenes/mis-pedidos/${usuarioId}`;

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (data) => {
        const ordenadas = data.sort(
          (a, b) => new Date(b.fechaOrden).getTime() - new Date(a.fechaOrden).getTime(),
        );
        this.orders.set(ordenadas);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando las órdenes:', err);
        this.isLoading.set(false);
      },
    });
  }

  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('es-PE', options);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  }

  openDetail(order: any): void {
    this.selectedOrder.set(order);
  }

  closeDetail(): void {
    this.selectedOrder.set(null);
  }
}
