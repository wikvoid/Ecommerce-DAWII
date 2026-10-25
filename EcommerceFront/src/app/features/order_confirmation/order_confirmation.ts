import { Component, inject, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { OrderService } from '../../core/services/order.service';
import { WebsocketService } from '../../services/websocket.service'; // Inyección del WebSocket

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './order_confirmation.html',
  styleUrls: ['./order_confirmation.css'],
})
export class OrderConfirmationComponent implements OnInit {
  order = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMsg = signal<string | null>(null);

  steps = signal([
    { id: 'CONFIRMADO', label: 'CONFIRMADO', done: true },
    { id: 'PREPARANDO', label: 'PREPARANDO', done: false },
    { id: 'LISTO', label: 'LISTO PARA RETIRO', done: false },
    { id: 'ENTREGADO', label: 'ENTREGADO', done: false },
  ]);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private wsService = inject(WebsocketService); // Instancia del servicio en tiempo real

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const orderId = Number(params['orderId']);

      if (orderId) {
        this.cargarOrdenReal(orderId);
      } else {
        this.errorMsg.set('No se encontró el número de orden.');
        this.isLoading.set(false);
      }
      sessionStorage.removeItem('lastOrderTotal');
    });

    // ESCUCHA ACTIVA: Conecta el WebSocket al Stepper de la UI
    this.wsService.ordenUpdates$.subscribe((ordenActualizada) => {
      const currentOrder = this.order();
      // Validamos que el mensaje recibido pertenezca a la orden en pantalla
      if (currentOrder && currentOrder.id === ordenActualizada.id) {
        this.order.update((o) => ({ ...o, estado: ordenActualizada.estado }));
        this.actualizarStepper(ordenActualizada.estado);
      }
    });
  }

  cargarOrdenReal(orderId: number): void {
    this.orderService.obtenerOrdenPorId(orderId).subscribe({
      next: (data) => {
        this.order.set({
          id: data.id, // Guardamos el ID para validar contra el WebSocket
          orderNumber: `ORD-${data.id.toString().padStart(6, '0')}`,
          date: new Date(data.fechaRegistro || data.fechaOrden || new Date()).toLocaleDateString(
            'es-PE',
            {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            },
          ),
          total: data.total || 0,
          pickupPerson: data.personaRetiro || 'Titular de la compra',
          client: {
            dni: data.usuario?.dni || 'Registrado',
            email: data.usuario?.email || 'correo@registrado.com',
          },
          estado: data.estado || 'PENDIENTE',
        });

        this.actualizarStepper(this.order().estado);
        this.isLoading.set(false);

        // SUSCRIPCIÓN AL TÚNEL: Si la orden no ha terminado, empezamos a escuchar sus cambios
        if (!['ENTREGADO', 'RECHAZADA_POR_STOCK', 'CANCELADO'].includes(data.estado)) {
          this.wsService.suscribirAOrden(data.id);
        }
      },
      error: (err) => {
        console.error('Error al obtener la orden', err);
        if (err.status === 403) {
          this.errorMsg.set('Acceso denegado. Este pedido pertenece a otro usuario.');
        } else if (err.status === 404) {
          this.errorMsg.set('El pedido que buscas no existe.');
        } else {
          this.errorMsg.set('No pudimos cargar los detalles de tu pedido.');
        }
        this.isLoading.set(false);
      },
    });
  }

  actualizarStepper(estadoBackend: string): void {
    // 1. Homologamos el estado técnico de la base de datos a los 4 pasos visuales
    let estadoVisual = 'CONFIRMADO';
    if (estadoBackend === 'PREPARANDO') estadoVisual = 'PREPARANDO';
    if (estadoBackend === 'LISTO_PARA_RECOJO') estadoVisual = 'LISTO';
    if (estadoBackend === 'ENTREGADO') estadoVisual = 'ENTREGADO';

    const estados = ['CONFIRMADO', 'PREPARANDO', 'LISTO', 'ENTREGADO'];
    const indexActual = estados.indexOf(estadoVisual);

    // 2. Actualizamos el Signal para re-renderizar los colores y checks en el HTML
    this.steps.update((currentSteps) =>
      currentSteps.map((step, i) => ({
        ...step,
        done: i <= indexActual,
      })),
    );
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val || 0);
  }

  goToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
