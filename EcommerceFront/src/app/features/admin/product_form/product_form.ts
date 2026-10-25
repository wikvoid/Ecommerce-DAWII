import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product_form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './product_form.html',
  styleUrls: ['./product_form.css'],
})
export class ProductFormComponent implements OnInit {
  producto = {
    nombre: '',
    marca: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoriaId: null as number | null,
    activo: true,
  };

  especificaciones: { propiedad: string; valor: string }[] = [{ propiedad: '', valor: '' }];
  categorias: any[] = [];

  isEditMode = false;
  productId: number | null = null;

  // Variables para la carga de imágenes
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  private productService = inject(ProductService);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // URL Base
  private readonly BUCKET_URL =
    'https://zelzkdnwqteejirqhvve.supabase.co/storage/v1/object/public/productos/';

  ngOnInit(): void {
    this.cargarCategorias();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = +id;
        this.cargarProductoParaEdicion(this.productId);
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (err) => console.error('Error al cargar categorías', err),
    });
  }

  cargarProductoParaEdicion(id: number): void {
    this.productService.obtenerProductoPorId(id).subscribe({
      next: (data) => {
        if (data) {
          this.producto = { ...this.producto, ...data };

          if (data.categoria) {
            this.producto.categoriaId = data.categoria.id;
          }

          // CONCATENACIÓN INTELIGENTE PARA LA VISTA PREVIA
          if (data.imagenUrl) {
            this.imagePreview = data.imagenUrl.startsWith('http')
              ? data.imagenUrl
              : this.BUCKET_URL + data.imagenUrl;
          }

          if (data.especificaciones && data.especificaciones !== 'null') {
            try {
              this.especificaciones = JSON.parse(data.especificaciones);
              if (this.especificaciones.length === 0) {
                this.agregarFila();
              }
            } catch (e) {
              console.error('Error al parsear especificaciones:', e);
            }
          } else {
            this.especificaciones = [{ propiedad: '', valor: '' }];
          }

          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar el producto', err),
    });
  }

  // EVENTO: Cuando el administrador selecciona o arrastra una foto
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Generar miniatura en vivo
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result || null;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  agregarFila(): void {
    this.especificaciones.push({ propiedad: '', valor: '' });
  }

  eliminarFila(index: number): void {
    if (this.especificaciones.length > 1) {
      this.especificaciones.splice(index, 1);
    } else {
      this.especificaciones[0] = { propiedad: '', valor: '' };
    }
  }

  guardarProducto(): void {
    const specsValidas = this.especificaciones.filter(
      (e) => e.propiedad.trim() !== '' && e.valor.trim() !== '',
    );

    const productoDTO = {
      ...this.producto,
      especificaciones: JSON.stringify(specsValidas),
    };

    const formData = new FormData();

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    formData.append(
      'producto',
      new Blob([JSON.stringify(productoDTO)], {
        type: 'application/json',
      }),
    );

    // USO DE SWEETALERT2 EN LUGAR DE ALERT()
    if (this.isEditMode && this.productId) {
      this.productService.actualizarProducto(this.productId, formData).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Actualizado!',
            text: 'El producto se modificó correctamente.',
            icon: 'success',
            confirmButtonColor: '#f5c800',
          }).then(() => {
            void this.router.navigate(['/admin/inventory']);
          });
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar el producto.', 'error'),
      });
    } else {
      this.productService.crearProducto(formData).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Publicado!',
            text: 'El producto está disponible en catálogo.',
            icon: 'success',
            confirmButtonColor: '#f5c800',
          }).then(() => {
            void this.router.navigate(['/admin/inventory']);
          });
        },
        error: () => Swal.fire('Error', 'No se pudo guardar el producto.', 'error'),
      });
    }
  }
}
