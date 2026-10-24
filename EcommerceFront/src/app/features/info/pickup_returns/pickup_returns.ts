import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-delivery-returns',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './pickup_returns.html',
  styleUrls: ['./pickup_returns.css'],
})
export class PickupReturnsComponent {
  pickupSteps = [
    {
      n: '1',
      title: 'Comprá online',
      desc: 'Realizá tu compra en nuestra web y recibí la confirmación con tu número de orden.',
    },
    {
      n: '2',
      title: 'Preparación inmediata',
      desc: 'Nuestro equipo separa y embala tus productos en menos de 2 horas hábiles.',
    },
    {
      n: '3',
      title: 'Retirá en mostrador',
      desc: 'Acercate a la tienda con tu DNI y el código de tu pedido sin hacer colas largas.',
    },
  ];

  returnPolicies = [
    {
      icon: '✅',
      title: 'Producto con falla o defecto',
      desc: 'Si el artículo presenta alguna falla de fábrica, te lo cambiamos de inmediato o gestionamos la garantía oficial de la marca.',
    },
    {
      icon: '🔄',
      title: 'Cambio por otro artículo',
      desc: 'Tenés hasta 30 días calendario para solicitar un cambio. El producto debe encontrarse sin uso, completo y con su empaque original.',
    },
    {
      icon: '💰',
      title: 'Devolución de dinero',
      desc: 'Si preferís el reembolso, realizamos la anulación de la transacción hacia tu tarjeta o cuenta bancaria en un plazo de 3 a 7 días hábiles.',
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
