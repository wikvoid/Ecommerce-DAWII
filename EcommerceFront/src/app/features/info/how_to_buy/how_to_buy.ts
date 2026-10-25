import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-como-comprar',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './how_to_buy.html',
  styleUrls: ['./how_to_buy.css'],
})
export class HowToBuyComponent {
  steps = [
    {
      n: '01',
      icon: '🔍',
      title: 'Buscá tu producto',
      desc: 'Navegá por las categorías o usá el buscador para encontrar lo que necesitás. Podés filtrar por marca, precio y disponibilidad de stock en tiempo real.',
    },
    {
      n: '02',
      icon: '🛒',
      title: 'Agregá al carrito',
      desc: 'Seleccioná la cantidad deseada y hacé clic en "Agregar al carrito". Podés continuar navegando y sumar más herramientas a tu orden.',
    },
    {
      n: '03',
      icon: '📋',
      title: 'Revisá tu pedido y agregá notas',
      desc: 'En el carrito verificá los productos seleccionados y el subtotal. Podés incluir instrucciones especiales o notas para la preparación de tu pedido.',
    },
    {
      n: '04',
      icon: '💳',
      title: 'Elegí tu medio de pago',
      desc: 'Aceptamos tarjetas de crédito, débito, transferencia bancaria y pagos digitales mediante pasarelas seguras.',
    },
    {
      n: '05',
      icon: '🏬',
      title: 'Retirá gratis en nuestra tienda',
      desc: 'Tu compra queda lista para despacho inmediato sin costo de flete. Acercate a nuestro mostrador con tu número de orden y retirala sin demoras.',
    },
  ];

  payMethods = [
    {
      name: 'Tarjetas de crédito',
      detail: 'Visa, Mastercard, American Express y Diners Club con planes en cuotas.',
      icon: '💳',
    },
    {
      name: 'Tarjetas de débito',
      detail: 'Visa Débito y Mastercard Débito con procesamiento inmediato y seguro.',
      icon: '🏦',
    },
    {
      name: 'Billeteras digitales',
      detail: 'Pagos mediante códigos QR y aplicaciones móviles.',
      icon: '📱',
    },
  ];

  constructor(
    public cartService: CartService,
    private router: Router,
  ) {}

  goCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
