import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router'; // 1. IMPORTAR ROUTER
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { TokenService } from '../../core/services/token.service';
import { WebsocketService } from '../../services/websocket.service';

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
  private wsService = inject(WebsocketService);
  private router = inject(Router); // 2. INYECTAR ROUTER

  ngOnInit(): void {
    this.fetchMyOrders();

    this.wsService.ordenUpdates$.subscribe((ordenActualizada) => {
      this.orders.update((ordersList) =>
        ordersList.map((o) => (o.id === ordenActualizada.id ? ordenActualizada : o)),
      );

      if (this.selectedOrder()?.id === ordenActualizada.id) {
        this.selectedOrder.set(ordenActualizada);
      }
    });
  }

  fetchMyOrders(): void {
    const usuarioId = this.tokenService.getUserId();
    const token = this.tokenService.getToken();

    if (!usuarioId || !token) {
      this.isLoading.set(false);
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `http://localhost:8080/api/ordenes/mis-pedidos/${usuarioId}`;

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (data) => {
        const ordenadas = data.sort(
          (a, b) => new Date(b.fechaOrden).getTime() - new Date(a.fechaOrden).getTime(),
        );
        this.orders.set(ordenadas);
        this.isLoading.set(false);

        ordenadas.forEach((orden) => {
          if (!['ENTREGADO', 'RECHAZADA_POR_STOCK', 'CANCELADO'].includes(orden.estado)) {
            this.wsService.suscribirAOrden(orden.id);
          }
        });
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

  // 3. NUEVO MÉTODO PARA NAVEGAR AL SEGUIMIENTO
  verSeguimiento(orderId: number): void {
    this.router.navigate(['/order-confirmation'], { queryParams: { orderId } });
  }
}
