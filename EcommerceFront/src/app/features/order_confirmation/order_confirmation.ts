import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { OrderService } from '../../core/services/order.service'; // Asegúrate de tener este servicio

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './order_confirmation.html',
  styleUrls: ['./order_confirmation.css'],
})
export class OrderConfirmationComponent implements OnInit {
  // Migrado a Signals
  order = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMsg = signal<string | null>(null);

  // Stepper dinámico
  steps = signal([
    { id: 'CONFIRMADO', label: 'CONFIRMADO', done: true },
    { id: 'PREPARANDO', label: 'PREPARANDO', done: false },
    { id: 'LISTO', label: 'LISTO PARA RETIRO', done: false },
    { id: 'ENTREGADO', label: 'ENTREGADO', done: false },
  ]);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  ngOnInit(): void {
    // 1. Capturamos el ID de la orden de la URL
    this.route.queryParams.subscribe((params) => {
      const orderId = Number(params['orderId']);

      if (orderId) {
        this.cargarOrdenReal(orderId);
      } else {
        this.errorMsg.set('No se encontró el número de orden.');
        this.isLoading.set(false);
      }

      // Limpieza de seguridad del carrito/session
      sessionStorage.removeItem('lastOrderTotal');
    });
  }

  cargarOrdenReal(orderId: number): void {
    this.orderService.obtenerOrdenPorId(orderId).subscribe({
      next: (data) => {
        // ... (Tu mapeo de datos existente se mantiene igual) ...
        this.order.set({
          orderNumber: `ORD-${data.id.toString().padStart(6, '0')}`,
          date: new Date(data.fechaRegistro || new Date()).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          total: data.total || 0,
          pickupPerson: data.personaRetiro || 'Titular de la compra',
          client: {
            dni: data.usuario?.dni || 'Registrado',
            email: data.usuario?.email || 'correo@registrado.com',
          },
          estado: data.estado || 'CONFIRMADO',
        });

        this.actualizarStepper(this.order().estado);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener la orden', err);

        // MANEJO DEL RECHAZO DE SEGURIDAD
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

  actualizarStepper(estadoActual: string): void {
    const estados = ['CONFIRMADO', 'PREPARANDO', 'LISTO', 'ENTREGADO'];
    const indexActual = estados.indexOf(estadoActual.toUpperCase());

    this.steps.update((currentSteps) =>
      currentSteps.map((step, i) => ({
        ...step,
        done: i <= indexActual, // Marca como completados los pasos anteriores y el actual
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
