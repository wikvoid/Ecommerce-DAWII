import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { FooterComponent } from '../../shared/components/footer/footer';
import { NavbarComponent } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavbarComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  topBrands: { name: string; logoUrl: string }[] = [];
  activeTab = 'Destacados';
  promos = [
    {
      title: 'ENVÍO GRATIS',
      subtitle: 'En compras mayores a S/ 200',
      color: '#1a3a6b',
      text: '#ffffff',
    },
    {
      title: 'RETIRO EN TIENDA',
      subtitle: 'Listo en 2 horas hábiles',
      color: '#f5c800',
      text: '#0f1c2e',
    },
  ];

  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Configuración de tu Supabase
  private readonly supabaseUrl = 'https://zelzkdnwqteejirqhvve.supabase.co';
  private readonly supabaseBucketUrl = `${this.supabaseUrl}/storage/v1/object/public/marcas`;
  // CONSTANTE PARA LAS IMÁGENES DE PRODUCTOS
  private readonly supabaseProductsUrl = `${this.supabaseUrl}/storage/v1/object/public/productos/`;

  // ¡REEMPLAZA ESTO CON TU LLAVE REAL DE SUPABASE!
  private readonly supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbHprZG53cXRlZWppcnFodnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MDMzNDMsImV4cCI6MjEwNTE3OTM0M30.7cEfL3YAYEDctOxQEJpr3DLSTL17qo_KpHsU4blpztQ';

  ngOnInit(): void {
    this.cargarDatosDinamicos();
    this.cargarMarcasDesdeStorage();
  }

  cargarDatosDinamicos(): void {
    this.productService.obtenerProductos().subscribe({
      next: (data) => {
        const mapeados = data.map((p) => {
          // Lógica de concatenación de URL
          let imgSrc = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
          if (p.imagenUrl) {
            imgSrc = p.imagenUrl.startsWith('http')
              ? p.imagenUrl
              : this.supabaseProductsUrl + p.imagenUrl;
          }

          return {
            id: p.id,
            name: p.nombre,
            brand: p.marca || 'Genérico',
            price: p.precio,
            // Eliminado el oldPrice simulado
            stock: p.stock > 0,
            stockReal: p.stock, // Agregado para validaciones del carrito
            badge: p.stock < 5 && p.stock > 0 ? 'ÚLTIMOS' : null,
            img: imgSrc,
            category: p.categoria?.nombre || 'General',
          };
        });

        this.products.set(mapeados.slice(0, 8));

        const catsUnicas = [...new Set(mapeados.map((p) => p.category))];
        this.categories.set(
          catsUnicas.slice(0, 6).map((cName) => ({
            name: cName,
            count: mapeados.filter((p) => p.category === cName).length,
            img: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=150&h=150&fit=crop',
          })),
        );
      },
      error: (err) => console.error('Error cargando productos:', err),
    });
  }

  cargarMarcasDesdeStorage(): void {
    const url = `${this.supabaseUrl}/storage/v1/object/list/marcas`;

    const body = {
      prefix: '',
      limit: 100,
      offset: 0,
      sortBy: {
        column: 'name',
        order: 'asc',
      },
    };

    const headers = {
      Authorization: `Bearer ${this.supabaseAnonKey}`,
      apikey: this.supabaseAnonKey,
      'Content-Type': 'application/json',
    };

    this.http.post<any[]>(url, body, { headers }).subscribe({
      next: (archivos) => {
        this.topBrands = archivos
          .filter((file) => file.name !== '.emptyFolderPlaceholder' && file.name !== 'empty')
          .map((file) => {
            const nombreSinExtension = file.name.split('.')[0];
            const nombreCapitalizado =
              nombreSinExtension.charAt(0).toUpperCase() + nombreSinExtension.slice(1);

            return {
              name: nombreCapitalizado,
              logoUrl: `${this.supabaseBucketUrl}/${file.name}`,
            };
          });
      },
      error: (err) => console.error('Error leyendo archivos de Supabase Storage:', err),
    });
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  }

  goToCatalog(categoria?: string): void {
    if (categoria) {
      this.router.navigate(['/catalog'], { queryParams: { categoria } });
    } else {
      this.router.navigate(['/catalog']);
    }
  }

  goToDetail(id: number): void {
    this.router.navigate(['/product', id]);
  }

  addToCart(product: any): void {
    if (product && product.stock) {
      this.cartService.addToCart(product, 1);
    }
  }
}
