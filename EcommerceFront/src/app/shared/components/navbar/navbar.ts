import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../../core/services/token.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit {
  categoryCounts: Record<string, number> = {};
  mobileOpen = false;
  openMegamenu: string | null = null;
  activeCatData: any = null;

  // Señal de Admin
  isAdmin = signal(false);

  // --- REFACTOR A SEÑALES ---
  isLogged = signal<boolean>(false);
  userFullName = signal<string>('');

  public router = inject(Router);
  public cartService = inject(CartService);
  private tokenService = inject(TokenService);

  navCategories = [
    {
      name: 'Herramientas',
      icon: '🛠️',
      hasDropdown: true,
      img: 'photo-1581147036324-c17ac41dfa6c',
      subcats: ['Manuales', 'Eléctricas'],
    },
    {
      name: 'Electricidad',
      icon: '⚡',
      hasDropdown: true,
      img: 'photo-1621905252507-b35492cc74b4',
      subcats: ['Cables', 'Iluminación'],
    },
    { name: 'Construcción', icon: '🧱', hasDropdown: false },
  ];

  ngOnInit(): void {
    this.checkLoginStatus();

    // 1. CORRECCIÓN: Llave de cierre agregada correctamente
    if (this.tokenService.isLogged()) {
      this.isAdmin.set(this.tokenService.isAdmin());
    }

    this.navCategories.forEach((cat) => {
      // 2. CORRECCIÓN: Restaurada la fórmula matemática correctamente
      this.categoryCounts[cat.name] = Math.floor(Math.random() * (500 - 100 + 1) + 100);
    });
  }

  checkLoginStatus(): void {
    this.isLogged.set(this.tokenService.isLogged());
    if (this.isLogged()) {
      this.userFullName.set(
        this.tokenService.getFullName ? this.tokenService.getFullName() : 'Cliente',
      );
    }
  }

  onLogout(): void {
    this.tokenService.logOut();

    // Vaciamos las señales al instante para que el HTML reaccione
    this.isLogged.set(false);
    this.userFullName.set('');
    this.isAdmin.set(false); // Apagamos los privilegios de admin visualmente

    // Agregamos /admin a las rutas que deben expulsar al usuario si cierra sesión
    const rutasProtegidas = ['/cart', '/checkout', '/order-confirmation', '/admin/customers'];
    const urlActual = this.router.url.split('?')[0];

    if (rutasProtegidas.includes(urlActual)) {
      this.router.navigate(['/home']);
    } else {
      window.location.reload();
    }

    this.closeMenus();
  }

  goHome(): void {
    this.router.navigate(['/home']);
    this.closeMenus();
  }

  goCart(): void {
    this.router.navigate(['/cart']);
    this.closeMenus();
  }

  goMyOrders(): void {
    this.router.navigate(['/mis-compras']);
    this.closeMenus();
  }

  onHoverCategory(cat: any): void {
    if (cat.hasDropdown) {
      this.openMegamenu = cat.name;
      this.activeCatData = cat;
    } else {
      this.openMegamenu = null;
      this.activeCatData = null;
    }
  }

  onCategoryClick(cat: any): void {
    this.router.navigate(['/catalog'], { queryParams: { categoria: cat.name } });
    this.closeMenus();
  }

  onSubcatClick(catName: string, subcatOrTerm: string): void {
    this.router.navigate(['/catalog'], { queryParams: { search: subcatOrTerm } });
    this.closeMenus();
  }

  getCategoryTotalCount(catName: string): number {
    return this.categoryCounts[catName] || 0;
  }

  private closeMenus(): void {
    this.openMegamenu = null;
    this.mobileOpen = false;
  }

  goAdmin(): void {
    this.router.navigate(['/admin/orders']);
    this.closeMenus();
  }
}
