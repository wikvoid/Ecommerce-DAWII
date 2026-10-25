import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { InvoiceSheetComponent } from '../../../shared/components/invoice-sheet/invoice-sheet';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrderService } from '../../../core/services/order.service';
import { WebsocketService } from '../../../services/websocket.service';

export type OrderStatus = 'Nuevo' | 'Preparando' | 'Listo para retirar' | 'Entregado' | 'Cancelado';
export type InvoiceType = 'Boleta electrónica' | 'Factura electrónica';

export interface AdminOrder {
  id: string;
  rawId: number;
  customer: string;
  initials: string;
  phone: string;
  createdAt: string;
  pickup: string;
  status: OrderStatus;
  total: number;
  items: number;
  payment: string;
  paymentMethod: string;
  opCode?: string;
  invoiceType: InvoiceType;
  docNumber: string;
  products: { name: string; qty: number; unitPrice?: number }[];
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoiceSheetComponent, PaginationComponent],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  filterStatus = signal<string>('Todos');
  searchQuery = signal<string>('');
  selectedOrder = signal<AdminOrder | null>(null);

  currentPage = signal<number>(1);
  pageSize = signal<number>(4);

  statuses = ['Todos', 'Nuevo', 'Preparando', 'Listo para retirar', 'Entregado'];
  orders = signal<AdminOrder[]>([]);

  filteredOrders = computed(() => {
    const search = this.searchQuery().trim().toLowerCase();
    const currentFilter = this.filterStatus();

    return this.orders().filter((order) => {
      const matchFilter = currentFilter === 'Todos' || order.status === currentFilter;
      const matchSearch =
        !search ||
        order.id.toLowerCase().includes(search) ||
        order.customer.toLowerCase().includes(search);
      return matchFilter && matchSearch;
    });
  });

  paginatedOrders = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredOrders().slice(startIndex, startIndex + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filteredOrders().length / this.pageSize()) || 1);

  private orderService = inject(OrderService);
  private wsService = inject(WebsocketService); // 2. INSTANCIA DE WS

  ngOnInit(): void {
    this.cargarOrdenes();

    // 3. REEMPLAZO DEL INTERVAL(5000) POR WEBSOCKETS EN TIEMPO REAL
    this.wsService.ordenUpdates$.subscribe((ordenActualizada) => {
      const newStatus = this.mapStatusToFrontend(ordenActualizada.estado);

      this.orders.update((currentOrders) => {
        const idx = currentOrders.findIndex((o) => o.rawId === ordenActualizada.id);
        if (idx !== -1) {
          const newOrders = [...currentOrders];
          newOrders[idx].status = newStatus;
          return newOrders;
        }
        return currentOrders; // Si es una orden totalmente nueva, requeriría recargar o hacer push
      });

      if (this.selectedOrder()?.rawId === ordenActualizada.id) {
        this.selectedOrder.update((o) => (o ? { ...o, status: newStatus } : null));
      }
    });
  }

  ngOnDestroy(): void {
    // Ya no hay subscripción de interval que destruir
  }

  cargarOrdenes(): void {
    this.orderService.obtenerTodasLasOrdenes().subscribe({
      next: (data: any[]) => {
        const mappedOrders = data.map((o) => ({
          rawId: o.id,
          id: `FM-${o.id.toString().padStart(4, '0')}`,
          customer:
            o.usuario?.nombre && o.usuario?.apellido
              ? `${o.usuario.nombre} ${o.usuario.apellido}`
              : o.nombreCliente || 'Cliente General',
          initials: this.getInitials(o.nombreCliente || o.usuario?.nombre || 'CG'),
          // Extraemos el teléfono y código de Yape (ajusta los nombres de variables según tu backend)
          phone: o.celularPago || o.usuario?.telefono || 'No registrado',
          opCode: o.codigoAprobacion || o.codigoOperacion || 'Sin código',
          createdAt: new Date(o.fechaOrden || o.fechaRegistro || new Date()).toLocaleString(
            'es-PE',
          ),
          pickup: 'Retiro en Tienda',
          status: this.mapStatusToFrontend(o.estado),
          total: o.total,
          items: o.detalles?.length || 0,
          payment: o.metodoPago || 'Efectivo / Tarjeta',
          paymentMethod: 'PAGADO',
          invoiceType:
            ((o.tipoComprobante + ' electrónica') as InvoiceType) || 'Boleta electrónica',
          docNumber: o.documentoCliente || o.usuario?.dni || 'No registrado',
          products:
            o.detalles?.map((d: any) => ({
              name: d.producto?.nombre || 'Producto',
              qty: d.cantidad,
              unitPrice: d.precioUnitario,
            })) || [],
        }));

        mappedOrders.sort((a, b) => b.rawId - a.rawId);
        this.orders.set(mappedOrders);

        // Suscribimos el admin a todas las ordenes activas
        mappedOrders.forEach((o) => {
          if (!['Entregado', 'Cancelado'].includes(o.status)) {
            this.wsService.suscribirAOrden(o.rawId);
          }
        });
      },
      error: (err) => console.error('Error al cargar órdenes:', err),
    });
  }

  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }
  setFilter(status: string): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
  }
  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
  }
  openOrderDetails(order: AdminOrder): void {
    this.selectedOrder.set({ ...order });
  }
  closeOrderDetails(): void {
    this.selectedOrder.set(null);
  }
  changeInvoiceType(type: InvoiceType): void {
    const currentOrder = this.selectedOrder();
    if (currentOrder) this.selectedOrder.set({ ...currentOrder, invoiceType: type });
  }
  printReceipt(): void {
    window.print();
  }
  formatPrice(val: number): string {
    return (
      'S/ ' +
      (val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }
  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
  updateOrderStatus(newStatus: OrderStatus): void {
    const currentOrder = this.selectedOrder();
    if (!currentOrder) return;

    const backendStatus = this.mapStatusToBackend(newStatus);
    const rawId = currentOrder.rawId;

    this.orderService.actualizarEstadoOrden(rawId, backendStatus).subscribe({
      next: () => {
        // La actualización de los Signals ahora se maneja sola a través del WebSocket que configuramos en el ngOnInit
        console.log(`Orden ${rawId} actualizada a ${newStatus}`);
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        alert('Hubo un error al actualizar el pedido en la base de datos.');
      },
    });
  }

  private mapStatusToFrontend(backendStatus: string): OrderStatus {
    const statusMap: { [key: string]: OrderStatus } = {
      PENDIENTE: 'Nuevo',
      EN_PROCESAMIENTO: 'Nuevo',
      EN_PREPARACION: 'Preparando',
      LISTO_PARA_RECOJO: 'Listo para retirar',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
    };
    return statusMap[backendStatus] || 'Nuevo';
  }

  private mapStatusToBackend(frontendStatus: OrderStatus): string {
    const statusMap: { [key: string]: string } = {
      Nuevo: 'EN_PROCESAMIENTO',
      Preparando: 'EN_PREPARACION',
      'Listo para retirar': 'LISTO_PARA_RECOJO',
      Entregado: 'ENTREGADO',
      Cancelado: 'CANCELADO',
    };
    return statusMap[frontendStatus] || 'EN_PROCESAMIENTO';
  }
}
