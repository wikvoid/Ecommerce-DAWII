import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';

export interface CustomerItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  lastPurchase: string;
  type: 'Regular' | 'Frecuente';
  initials: string;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [FormsModule, PaginationComponent],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css'],
})
export class CustomersComponent implements OnInit {
  // 1. Estado Reactivo con Signals
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);
  isLoading = signal<boolean>(true);

  customers = signal<CustomerItem[]>([]);

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/usuarios';

  // 2. Filtros y paginación auto-calculables (Computed)
  filteredCustomers = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.customers();
    return this.customers().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
  });

  paginatedCustomers = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCustomers().slice(startIndex, startIndex + this.pageSize());
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredCustomers().length / this.pageSize()) || 1;
  });

  ngOnInit(): void {
    this.fetchCustomers();
  }

  fetchCustomers(): void {
    this.isLoading.set(true);
    // Consumimos el endpoint de estadísticas de Spring Boot
    this.http.get<any[]>(`${this.apiUrl}/clientes`).subscribe({
      next: (data) => {
        const mapped = data.map((usuario) => {
          const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();

          // Genera iniciales (Ej: Victor Jose -> VJ)
          const iniciales =
            nombreCompleto
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase() || 'CL';

          return {
            id: usuario.id,
            name: nombreCompleto,
            email: usuario.email,
            phone: usuario.telefono || 'Sin teléfono',
            orders: usuario.totalPedidos || 0,
            spent: usuario.totalGastado || 0,
            lastPurchase: usuario.ultimaCompra || 'Sin compras',
            type: (usuario.totalPedidos || 0) >= 5 ? 'Frecuente' : 'Regular',
            initials: iniciales,
          } as CustomerItem;
        });

        this.customers.set(mapped);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar la lista de clientes:', err);
        this.isLoading.set(false);
      },
    });
  }

  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
  }

  onSearchChange(newSearch: string): void {
    this.searchQuery.set(newSearch);
    this.currentPage.set(1); // Volver a la página 1 al buscar
  }

  formatPrice(val: number): string {
    return (
      'S/ ' +
      (val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }
}
