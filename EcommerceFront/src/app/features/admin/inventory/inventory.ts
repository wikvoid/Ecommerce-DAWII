import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { ProductService } from '../../../core/services/product.service';

export interface ProductItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  minimum: number;
  location: string;
  sku: string;
  img: string;
  description?: string;
  active: boolean;
}

export interface InventoryToast {
  type: 'success' | 'error';
  title: string;
  message: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css'],
})
export class InventoryComponent implements OnInit {
  // --- Estado Reactivo con Signals ---
  items = signal<ProductItem[]>([]);
  dynamicCategories = signal<string[]>(['Todas']);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('Todas');
  criticalOnly = signal<boolean>(false);

  currentPage = signal<number>(1);
  pageSize = signal<number>(8);

  selectedProductDetail = signal<ProductItem | null>(null);
  itemToDelete = signal<ProductItem | null>(null);

  toast = signal<InventoryToast | null>(null);
  private toastTimeout: any = null;

  private productService = inject(ProductService);
  private router = inject(Router);

  // --- Computed Signals para Filtros y Paginación ---
  filteredItems = computed(() => {
    const search = this.searchQuery().trim().toLowerCase();
    const category = this.selectedCategory();
    const critical = this.criticalOnly();

    return this.items().filter((p) => {
      const matchCategory = category === 'Todas' || p.category === category;
      const matchCritical = !critical || p.stock <= p.minimum;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search);

      return matchCategory && matchCritical && matchSearch;
    });
  });

  paginatedItems = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredItems().slice(startIndex, startIndex + this.pageSize());
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredItems().length / this.pageSize()) || 1;
  });

  ngOnInit(): void {
    this.cargarInventario();
  }

  cargarInventario(): void {
    // 1. CONSTANTE DE SUPABASE
    const BUCKET_URL =
      'https://zelzkdnwqteejirqhvve.supabase.co/storage/v1/object/public/productos/';

    this.productService.obtenerProductos().subscribe({
      next: (data: any[]) => {
        const mappedItems = data.map((p) => {
          // 2. CONCATENACIÓN INTELIGENTE
          let imgSrc = 'https://via.placeholder.com/150';
          if (p.imagenUrl) {
            imgSrc = p.imagenUrl.startsWith('http') ? p.imagenUrl : BUCKET_URL + p.imagenUrl;
          }

          return {
            id: p.id,
            name: p.nombre,
            brand: p.marca || 'Genérico',
            category: p.categoria?.nombre || 'General',
            price: p.precio,
            stock: p.stock,
            minimum: 5,
            location: 'Almacén Central',
            sku: `SKU-${p.id.toString().padStart(5, '0')}`,
            img: imgSrc, // <-- Aquí pasa la URL completa
            description: p.descripcion,
            active: p.activo !== false,
          };
        });

        this.items.set(mappedItems);

        const cats = [...new Set(mappedItems.map((i) => i.category))];
        this.dynamicCategories.set(['Todas', ...cats]);
      },
      error: () => {
        this.showToast('error', 'Error de conexión', 'No se pudo cargar el inventario.');
      },
    });
  }

  // --- Métodos de Interacción ---
  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  toggleCritical(): void {
    this.criticalOnly.update((v) => !v);
    this.currentPage.set(1);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val || 0);
  }

  openDetailModal(p: ProductItem): void {
    this.selectedProductDetail.set(p);
  }

  closeDetailModal(): void {
    this.selectedProductDetail.set(null);
  }

  toggleStatus(p: ProductItem): void {
    // Aquí podrías agregar la llamada al backend para actualizar el estado 'activo'
    this.items.update((current) => {
      const idx = current.findIndex((item) => item.id === p.id);
      if (idx !== -1) {
        const updated = [...current];
        updated[idx].active = !updated[idx].active;
        return updated;
      }
      return current;
    });

    const newState = !p.active; // El estado fue invertido
    this.showToast(
      'success',
      newState ? 'Producto Activado' : 'Producto Pausado',
      `"${p.name}" ahora está ${newState ? 'visible' : 'oculto'}.`,
    );
  }

  editProduct(p: ProductItem): void {
    void this.router.navigate(['/admin/product-form', p.id]);
  }

  promptDelete(p: ProductItem): void {
    this.itemToDelete.set(p);
  }

  cancelDelete(): void {
    this.itemToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.itemToDelete();
    if (!target) return;

    const id = target.id;
    const name = target.name;

    this.productService.eliminarProducto(id).subscribe({
      next: () => {
        this.items.update((current) => current.filter((p) => p.id !== id));
        this.itemToDelete.set(null);
        this.showToast('success', 'Producto Eliminado', `"${name}" fue removido.`);

        // Ajuste de página si borramos el último ítem de la vista actual
        if (this.paginatedItems().length === 0 && this.currentPage() > 1) {
          this.currentPage.update((p) => p - 1);
        }
      },
      error: () => {
        this.showToast('error', 'Error', `No se pudo eliminar "${name}".`);
        this.itemToDelete.set(null);
      },
    });
  }

  showToast(type: 'success' | 'error', title: string, message: string): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast.set({ type, title, message });

    this.toastTimeout = setTimeout(() => {
      this.toast.set(null);
    }, 3200);
  }
}
