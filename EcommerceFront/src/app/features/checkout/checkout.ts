import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  // 1. Eliminamos 'transfer' de las opciones válidas
  paymentMethod = signal<'card' | 'yape'>('card');
  cardData = signal({ number: '', name: '', expiry: '', cvv: '' });
  yapeData = signal({ phone: '', approvalCode: '' });
  isProcessing = signal(false);

  public cartService = inject(CartService);
  public tokenService = inject(TokenService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  userProfile = computed(() => {
    return {
      fullName: this.tokenService.getUserName() || 'Usuario Ferremas',
      email: this.tokenService.getUserEmail() || 'correo@registrado.com',
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

  updateYapeField(field: string, value: string): void {
    this.yapeData.update((data) => ({ ...data, [field]: value }));
  }

  onSubmitOrder(): void {
    const method = this.paymentMethod();
    const card = this.cardData();
    const yape = this.yapeData();

    // Validaciones
    if (method === 'card' && (!card.number || !card.cvv || !card.name || !card.expiry)) {
      Swal.fire(
        'Datos Incompletos',
        'Por favor, ingresa los datos completos de tu tarjeta.',
        'warning',
      );
      return;
    }

    if (method === 'yape' && (!yape.phone || !yape.approvalCode)) {
      Swal.fire('Datos Incompletos', 'Ingresa tu celular y el código de aprobación (OTP) de 6 dígitos para autorizar el cargo.', 'warning');
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
      // 2. Simplificamos la asignación del método de pago
      metodoPago: this.paymentMethod() === 'card' ? 'Tarjeta Débito/Crédito' : 'Yape',
    };

    this.orderService.crearOrden(dto).subscribe({
      next: (respuestaOrden) => {
        sessionStorage.setItem('lastOrderTotal', this.cartService.total().toString());
        this.cartService.clearCart();

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
