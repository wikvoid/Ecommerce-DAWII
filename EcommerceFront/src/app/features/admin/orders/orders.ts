import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { InvoiceSheetComponent } from '../../../shared/components/invoice-sheet/invoice-sheet';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrderService } from '../../../core/services/order.service';

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
  // 1. Estado reactivo con Signals
  filterStatus = signal<string>('Todos');
  searchQuery = signal<string>('');
  selectedOrder = signal<AdminOrder | null>(null);

  currentPage = signal<number>(1);
  pageSize = signal<number>(4);

  statuses = ['Todos', 'Nuevo', 'Preparando', 'Listo para retirar', 'Entregado'];
  orders = signal<AdminOrder[]>([]);

  // 2. Computed Signals (Se recalcula automáticamente y de forma óptima)
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

  totalPages = computed(() => {
    return Math.ceil(this.filteredOrders().length / this.pageSize()) || 1;
  });

  private orderService = inject(OrderService);
  private autoSyncSub?: Subscription;

  ngOnInit(): void {
    this.cargarOrdenes();
    // Auto-sincronización silenciosa en segundo plano
    this.autoSyncSub = interval(5000).subscribe(() => this.cargarOrdenes());
  }

  ngOnDestroy(): void {
    if (this.autoSyncSub) this.autoSyncSub.unsubscribe();
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
          phone: o.usuario?.telefono || 'No registrado',
          createdAt: new Date(o.fechaOrden || o.fechaRegistro || new Date()).toLocaleString(
            'es-PE',
          ),
          pickup: 'Retiro en Tienda',
          status: this.mapStatusToFrontend(o.estado),
          total: o.total,
          items: o.detalles?.length || 0,
          payment: o.metodoPago || 'Efectivo / Tarjeta',
          paymentMethod: 'PAGADO',
          opCode: o.codigoOperacion || 'N/A',
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
        // Ordenamos del más reciente al más antiguo por seguridad
        mappedOrders.sort((a, b) => b.rawId - a.rawId);
        this.orders.set(mappedOrders);
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
    if (currentOrder) {
      this.selectedOrder.set({ ...currentOrder, invoiceType: type });
    }
  }

  updateOrderStatus(newStatus: OrderStatus): void {
    const currentOrder = this.selectedOrder();
    if (!currentOrder) return;

    const backendStatus = this.mapStatusToBackend(newStatus);
    const rawId = currentOrder.rawId;

    this.orderService.actualizarEstadoOrden(rawId, backendStatus).subscribe({
      next: () => {
        // Actualizamos la Signal del Drawer
        this.selectedOrder.set({ ...currentOrder, status: newStatus });

        // Actualizamos la Signal principal de órdenes inmutando el array
        this.orders.update((currentOrders) => {
          const idx = currentOrders.findIndex((o) => o.rawId === rawId);
          if (idx !== -1) {
            const newOrders = [...currentOrders];
            newOrders[idx].status = newStatus;
            return newOrders;
          }
          return currentOrders;
        });
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        alert('Hubo un error al actualizar el pedido en la base de datos.');
      },
    });
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
