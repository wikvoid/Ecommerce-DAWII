import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Asegúrate de usar las rutas relativas correctas según tu proyecto
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { TokenService } from '../../core/services/token.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class CartComponent {
  // Nota opcional que el usuario puede escribir (preparada por Nicole en el HTML)
  orderNote: string = '';

  // Inyección de servicios
  public cartService = inject(CartService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  // Botón "Seguir comprando" o "Ir al catálogo"
  goCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  // Formateador de moneda para la vista
  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  }

  // El botón clave: "Finalizar compra"
  onCheckout(): void {
    if (this.cartService.cartItems().length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    // Guardamos la nota del usuario en sessionStorage por si la necesitan en el checkout
    if (this.orderNote.trim() !== '') {
      sessionStorage.setItem('orderNote', this.orderNote);
    }

    // Validamos si está logueado ANTES de enviarlo al checkout
    if (this.tokenService.isLogged()) {
      this.router.navigate(['/checkout']);
    } else {
      // Si no está logueado, lo mandamos al login, y le pasamos una query param
      // para que el login sepa que debe regresarlo al checkout después de entrar
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
    }
  }
}
