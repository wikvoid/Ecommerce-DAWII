import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para Pipes o directivas
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { TokenService } from '../../core/services/token.service';
import { CartService } from '../../core/services/cart.service';
import { NuevaOrdenDTO, OrderService } from '../../core/services/order.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class CheckoutComponent implements OnInit {
  // Estado Reactivo
  pickupOption = signal<'self' | 'other'>('self');
  authorizedPerson = signal('');
  paymentMethod = signal<'card' | 'transfer' | 'store'>('card');

  cardData = signal({ number: '', name: '', expiry: '', cvv: '' });
  isProcessing = signal(false);

  // Inyección de dependencias
  public cartService = inject(CartService);
  public tokenService = inject(TokenService); // Público para usarlo en la vista
  private orderService = inject(OrderService);
  private router = inject(Router);

  // Computed: Información del usuario logueado extraída del Token
  userProfile = computed(() => {
    return {
      fullName: this.tokenService.getUserName() || 'Usuario Ferremas',
      email: this.tokenService.getUserEmail() || 'correo@registrado.com',
      // Simula el DNI o Teléfono, si el token los trae, reemplázalos por los métodos reales
      dni: 'DNI registrado',
      phone: 'Teléfono registrado',
    };
  });

  ngOnInit(): void {
    if (this.cartService.cartItems().length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  }

  updateCardField(field: string, value: string): void {
    this.cardData.update((data) => ({ ...data, [field]: value }));
  }

  onSubmitOrder(): void {
    const method = this.paymentMethod();
    const card = this.cardData();

    // Validaciones
    if (method === 'card' && (!card.number || !card.cvv || !card.name || !card.expiry)) {
      Swal.fire(
        'Datos Incompletos',
        'Por favor, ingresa los datos completos de tu tarjeta.',
        'warning',
      );
      return;
    }

    if (this.pickupOption() === 'other' && !this.authorizedPerson().trim()) {
      Swal.fire(
        'Datos Incompletos',
        'Ingresa el nombre y DNI de la persona autorizada a retirar.',
        'warning',
      );
      return;
    }

    const userId = this.tokenService.getUserId();
    if (!userId) {
      Swal.fire(
        'Sesión Expirada',
        'Por favor, vuelve a iniciar sesión para completar la compra.',
        'error',
      ).then(() => this.router.navigate(['/login']));
      return;
    }

    this.isProcessing.set(true);

    const dto: NuevaOrdenDTO = {
      usuarioId: userId,
      items: this.cartService.cartItems().map((item) => ({
        productoId: item.id,
        cantidad: item.qty,
      })),
      canal: 'Web (Online)',
      metodoPago:
        this.paymentMethod() === 'card'
          ? 'Tarjeta Débito/Crédito'
          : this.paymentMethod() === 'transfer'
            ? 'Transferencia Bancaria'
            : 'Pago en Mostrador',
    };

    this.orderService.crearOrden(dto).subscribe({
      next: (respuestaOrden) => {
        sessionStorage.setItem('lastOrderTotal', this.cartService.total().toString());
        this.cartService.clearCart();

        // SweetAlert de éxito breve antes de navegar
        Swal.fire({
          icon: 'success',
          title: '¡Compra exitosa!',
          text: 'Redirigiendo a tu confirmación...',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/order-confirmation'], {
            queryParams: { orderId: respuestaOrden.id },
          });
        });
      },
      error: (err) => {
        this.isProcessing.set(false);
        Swal.fire(
          'Error en el pago',
          err.error?.message || 'Hubo un error al procesar tu pago. Inténtalo nuevamente.',
          'error',
        );
      },
    });
  }
}
