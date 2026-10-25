import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { CategoriaService } from '../../../core/services/categoria.service';
import Swal from 'sweetalert2';

export interface CategoryItem {
  id: number;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo?: boolean;
  // Mapeados para UI
  name: string;
  code: string;
  description: string;
  productCount: number;
  active: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, RouterModule, PaginationComponent],
  templateUrl: './categories.html',
  styleUrls: ['./categories.css'],
})
export class CategoriesComponent implements OnInit {
  categories = signal<CategoryItem[]>([]);
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);

  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  categoryForm = signal({
    name: '',
    code: '',
    description: '',
  });

  private categoriaService = inject(CategoriaService);

  filteredCategories = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.categories();
    return this.categories().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  });

  paginatedCategories = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCategories().slice(startIndex, startIndex + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filteredCategories().length / this.pageSize()) || 1);

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe({
      next: (data: any[]) => {
        const mapped = data.map((cat) => ({
          id: cat.id,
          nombre: cat.nombre,
          name: cat.nombre,
          code: cat.codigo || `CAT-${cat.nombre.substring(0, 4).toUpperCase()}`,
          description: cat.descripcion || 'Sin descripción.',
          productCount: cat.productosAsociados || 0, // Pendiente conectarlo al count real de productos
          active: cat.activo !== false,
        }));
        this.categories.set(mapped);
      },
      error: () =>
        Swal.fire('Error', 'No se pudieron cargar las categorías desde el servidor.', 'error'),
    });
  }

  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
  }
  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  toggleStatus(cat: CategoryItem): void {
    const newState = !cat.active;
    const categoryUpdate = {
      nombre: cat.name,
      codigo: cat.code,
      descripcion: cat.description,
      activo: newState,
    };

    this.categoriaService.actualizarCategoria(cat.id, categoryUpdate).subscribe({
      next: () => {
        this.categories.update((current) => {
          const idx = current.findIndex((c) => c.id === cat.id);
          if (idx !== -1) {
            const updated = [...current];
            updated[idx].active = newState;
            return updated;
          }
          return current;
        });
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          icon: 'success',
          title: newState ? 'Categoría Activada' : 'Categoría Pausada',
        });
      },
      error: () =>
        Swal.fire('Error', 'No se pudo actualizar el estado en la base de datos.', 'error'),
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.categoryForm.set({ name: '', code: '', description: '' });
    this.isModalOpen.set(true);
  }

  openEditModal(cat: CategoryItem): void {
    this.isEditing.set(true);
    this.editingId.set(cat.id);
    this.categoryForm.set({
      name: cat.name,
      code: cat.code,
      description: cat.description,
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  updateForm(field: string, value: string) {
    this.categoryForm.update((form) => ({ ...form, [field]: value }));
  }

  saveCategory(): void {
    const form = this.categoryForm();
    if (!form.name.trim() || !form.code.trim()) {
      Swal.fire('Atención', 'Completa al menos el nombre y el código de la categoría.', 'warning');
      return;
    }

    const categoryData = {
      nombre: form.name,
      codigo: form.code.toUpperCase(),
      descripcion: form.description,
      activo: true,
    };

    const action =
      this.isEditing() && this.editingId() !== null
        ? this.categoriaService.actualizarCategoria(this.editingId()!, categoryData)
        : this.categoriaService.crearCategoria(categoryData);

    action.subscribe({
      next: () => {
        this.cargarCategorias();
        this.closeModal();
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          icon: 'success',
          title: this.isEditing() ? 'Categoría Actualizada' : 'Categoría Creada',
        });
      },
      error: () =>
        Swal.fire('Error', 'Ocurrió un problema al guardar en la base de datos.', 'error'),
    });
  }
}
