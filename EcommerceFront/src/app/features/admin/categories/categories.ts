import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { CategoriaService } from '../../../core/services/categoria.service'; // Asegúrate de la ruta
import Swal from 'sweetalert2';

export interface CategoryItem {
  id: number;
  nombre: string;
  codigo?: string; // Puede no existir en tu backend
  descripcion?: string; // Puede no existir en tu backend
  icono?: string; // Puede no existir en tu backend
  activo?: boolean; // Puede no existir en tu backend
  // Mapeamos para el frontend
  name: string;
  code: string;
  description: string;
  icon: string;
  productCount: number;
  active: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './categories.html',
  styleUrls: ['./categories.css'],
})
export class CategoriesComponent implements OnInit {
  // --- Estado Reactivo ---
  categories = signal<CategoryItem[]>([]);
  searchQuery = signal<string>('');

  currentPage = signal<number>(1);
  pageSize = signal<number>(8);

  // --- Modal ---
  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  // El modelo del formulario usa una señal para facilitar la reactividad
  categoryForm = signal({
    name: '',
    code: '',
    description: '',
    icon: '🔧',
  });

  availableIcons: string[] = ['🔧', '🧱', '🎨', '⚡', '🚿', '🌿', '🦺', '🔩', '🪵'];

  private categoriaService = inject(CategoriaService);

  // --- Propiedades Computadas ---
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

  totalPages = computed(() => {
    return Math.ceil(this.filteredCategories().length / this.pageSize()) || 1;
  });

  totalCategories = computed(() => this.categories().length);
  activeCategories = computed(() => this.categories().filter((c) => c.active).length);
  inactiveCategories = computed(() => this.categories().filter((c) => !c.active).length);

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe({
      next: (data: any[]) => {
        // Mapeamos los datos que vengan de tu backend a la interfaz del frontend
        const mapped = data.map((cat) => ({
          id: cat.id,
          nombre: cat.nombre,
          // Si tu backend no tiene estos campos, creamos datos por defecto para la UI
          name: cat.nombre,
          code: cat.codigo || `CAT-${cat.nombre.substring(0, 4).toUpperCase()}`,
          description: cat.descripcion || 'Sin descripción detallada.',
          icon: cat.icono || '🔧',
          productCount: cat.productosAsociados || Math.floor(Math.random() * 50), // Simulación si no viene
          active: cat.activo !== false, // Por defecto true
        }));
        this.categories.set(mapped);
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
      },
    });
  }

  // --- Interacciones ---
  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
  }

  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  toggleStatus(cat: CategoryItem): void {
    // Aquí idealmente llamas al backend para cambiar el estado
    // this.categoriaService.cambiarEstado(cat.id, !cat.active).subscribe(...)

    this.categories.update((current) => {
      const idx = current.findIndex((c) => c.id === cat.id);
      if (idx !== -1) {
        const updated = [...current];
        updated[idx].active = !updated[idx].active;
        return updated;
      }
      return current;
    });

    const newState = !cat.active;
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      icon: 'success',
      title: newState ? 'Categoría Activada' : 'Categoría Inactivada',
      text: `"${cat.name}" ahora está ${newState ? 'disponible' : 'pausada'}.`,
    });
  }

  // --- Manejo del Modal ---
  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.categoryForm.set({ name: '', code: '', description: '', icon: '🔧' });
    this.isModalOpen.set(true);
  }

  openEditModal(cat: CategoryItem): void {
    this.isEditing.set(true);
    this.editingId.set(cat.id);
    this.categoryForm.set({
      name: cat.name,
      code: cat.code,
      description: cat.description,
      icon: cat.icon,
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  setIcon(icon: string) {
    this.categoryForm.update((form) => ({ ...form, icon }));
  }

  updateForm(field: string, value: string) {
    this.categoryForm.update((form) => ({ ...form, [field]: value }));
  }

  saveCategory(): void {
    const form = this.categoryForm();
    if (!form.name.trim() || !form.code.trim()) {
      Swal.fire('Atención', 'Completa al menos el nombre y el código.', 'warning');
      return;
    }

    const categoryData = {
      nombre: form.name,
      codigo: form.code.toUpperCase(),
      descripcion: form.description,
      icono: form.icon,
      activo: true,
    };

    if (this.isEditing() && this.editingId() !== null) {
      // LLAMADA HTTP: EDITAR
      this.categoriaService.actualizarCategoria(this.editingId()!, categoryData).subscribe({
        next: (catActualizada) => {
          this.cargarCategorias(); // Recargar la tabla desde la BD
          this.closeModal();
          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            icon: 'success',
            title: 'Categoría Actualizada',
          });
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar la categoría', 'error'),
      });
    } else {
      // LLAMADA HTTP: CREAR
      this.categoriaService.crearCategoria(categoryData).subscribe({
        next: (nuevaCat) => {
          this.cargarCategorias(); // Recargar la tabla desde la BD
          this.closeModal();
          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            icon: 'success',
            title: 'Categoría Creada',
          });
        },
        error: () => Swal.fire('Error', 'No se pudo crear la categoría', 'error'),
      });
    }
  }
}
