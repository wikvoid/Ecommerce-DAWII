import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SubNavItem {
  label: string;
  route: string;
}

export interface NavItem {
  id: string;
  label: string;
  route?: string;
  icon: string;
  badge?: number;
  children?: SubNavItem[];
  isOpen?: boolean;
}

interface NotificationItem {
  text: string;
  time: string;
  type: 'blue' | 'amber';
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class LayoutComponent {
  mobileOpen: boolean = false;
  notificationsOpen: boolean = false;
  toastMessage: string | null = null;
  private toastTimer: any = null;

  currentTitle: string = 'Resumen general';
  currentSubtitle: string = 'Todo lo que pasa hoy en Ferremas';

  titles: Record<string, [string, string]> = {
    orders: ['Pedidos y retiros', 'Gestioná los pedidos que llegan a la tienda'],
    inventory: ['Inventario de Productos', 'Controlá existencias y reposición'],
    categories: ['Categorías de Almacén', 'Organización de rubros de ferretería'],
    pos: ['Venta POS', 'Punto de venta y caja en mostrador'],
    customers: ['Clientes', 'Conocé la actividad de tus compradores'],
    sales: ['Registro de Ventas', 'Historial de comprobantes emitidos en tienda y web'],
    reports: ['Reportes', 'Analizá el rendimiento de tu negocio'],
  };

  navigation: NavItem[] = [
    { id: 'orders', label: 'Pedidos', route: '/admin/orders', icon: 'orders', badge: 1 },
    { id: 'pos', label: 'Venta POS', route: '/admin/pos', icon: 'pos' },
    {
      id: 'warehouse',
      label: 'Almacén',
      icon: 'inventory',
      isOpen: true,
      children: [
        { label: 'Productos', route: '/admin/inventory' },
        { label: 'Categoría', route: '/admin/categories' },
      ],
    },
    { id: 'customers', label: 'Clientes', route: '/admin/customers', icon: 'customers' },
    { id: 'sales', label: 'Ventas', route: '/admin/sales', icon: 'sales' },
    { id: 'reports', label: 'Reportes', route: '/admin/reports', icon: 'reports' },
  ];

  notifications: NotificationItem[] = [
    { text: 'Nuevo pedido FM-1048 recibido', time: 'Hace 10 min', type: 'blue' },
    { text: '2 productos necesitan reposición', time: 'Hace 20 min', type: 'amber' },
    { text: 'Pedido FM-1046 listo para retirar', time: 'Hace 30 min', type: 'blue' },
  ];

  constructor(private router: Router) {
    this.updateHeaderTitles(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateHeaderTitles(event.urlAfterRedirects);
        this.mobileOpen = false;
      });
  }

  private updateHeaderTitles(url: string): void {
    const section = url.split('/')[2] || 'dashboard';
    if (this.titles[section]) {
      this.currentTitle = this.titles[section][0];
      this.currentSubtitle = this.titles[section][1];
    }
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile(): void {
    this.mobileOpen = false;
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
  }

  toggleSubmenu(item: NavItem): void {
    item.isOpen = !item.isOpen;
  }

  isSubmenuActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some((sub) => this.router.url.startsWith(sub.route));
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 2800);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-container')) {
      this.notificationsOpen = false;
    }
  }
}
