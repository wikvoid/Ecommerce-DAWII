import { Component, HostListener, OnInit, inject } from '@angular/core';

import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TokenService } from '../../../core/services/token.service';
import { WebsocketService } from '../../../services/websocket.service';

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
export interface NotificationItem {
  text: string;
  time: string;
  type: 'blue' | 'amber';
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class LayoutComponent implements OnInit {
  mobileOpen: boolean = false;
  notificationsOpen: boolean = false;
  toastMessage: string | null = null;
  private toastTimer: any = null;

  currentTitle: string = 'Resumen general';
  currentSubtitle: string = 'Todo lo que pasa hoy en Ferremas';

  // Datos de usuario dinámicos
  adminName: string = 'Administrador';
  adminInitials: string = 'AD';
  unreadCount: number = 0;

  private router = inject(Router);
  private tokenService = inject(TokenService);
  private wsService = inject(WebsocketService);

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
    { id: 'orders', label: 'Pedidos', route: '/admin/orders', icon: 'orders' },
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

  notifications: NotificationItem[] = [];

  constructor() {
    this.updateHeaderTitles(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateHeaderTitles(event.urlAfterRedirects);
        this.mobileOpen = false;
      });
  }

  ngOnInit(): void {
    // 1. Cargar datos del usuario real
    const fullName = this.tokenService.getUserName() || 'Administrador Sistema';
    this.adminName = fullName;
    this.adminInitials = fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    // 2. Escucha global de WebSockets para Notificaciones
    this.wsService.ordenUpdates$.subscribe((orden) => {
      // Si la orden es nueva, alertamos con azul; si es actualización, con amarillo
      const isNew = orden.estado === 'PENDIENTE' || orden.estado === 'EN_PROCESAMIENTO';
      const msg = isNew
        ? `Nuevo pedido FM-${orden.id} recibido`
        : `Pedido FM-${orden.id} pasó a ${orden.estado.replace('_', ' ')}`;

      this.triggerToast(msg);

      this.notifications.unshift({
        text: msg,
        time: 'Justo ahora',
        type: isNew ? 'blue' : 'amber',
      });

      this.unreadCount++;

      // Actualizar el badge del menú lateral de órdenes
      const ordersNav = this.navigation.find((n) => n.id === 'orders');
      if (ordersNav) ordersNav.badge = (ordersNav.badge || 0) + (isNew ? 1 : 0);
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
    if (this.notificationsOpen) this.unreadCount = 0; // Limpiar contador al abrir
  }
  toggleSubmenu(item: NavItem): void {
    item.isOpen = !item.isOpen;
  }
  isSubmenuActive(item: NavItem): boolean {
    return !!item.children?.some((sub) => this.router.url.startsWith(sub.route));
  }
  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  logout(): void {
    sessionStorage.clear(); // O el método que uses en tokenService.logOut()
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
