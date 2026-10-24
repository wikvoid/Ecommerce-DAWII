import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css'],
})
export class ProductDetailComponent implements OnInit {
  // Refactorizado a Signals
  product = signal<any>(null);
  selectedImageIndex = signal<number>(0);
  quantity = signal<number>(1);
  activeTab = signal<'desc' | 'specs'>('desc');

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);

  // Mantenemos público para el Navbar
  public cartService = inject(CartService);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProduct(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  loadProduct(id: number): void {
    this.productService.obtenerProductoPorId(id).subscribe({
      next: (backendProd) => {
        this.product.set(this.mapearProducto(backendProd));
        this.selectedImageIndex.set(0);
        this.quantity.set(1);
      },
      error: () => {
        this.router.navigate(['/home']);
      },
    });
  }

  mapearProducto(backendProd: any): any {
    // 1. CONSTANTE DE SUPABASE (Ajusta el nombre de tu proyecto si es necesario)
    const BUCKET_URL =
      'https://zelzkdnwqteejirqhvve.supabase.co/storage/v1/object/public/productos/';

    // 2. CONCATENACIÓN INTELIGENTE
    let imgCode = 'https://via.placeholder.com/600x600?text=Sin+Imagen';
    if (backendProd.imagenUrl) {
      // Si la BD ya trae un "http..." (productos viejos), úsalo. Si solo trae "foto.jpg" (productos nuevos), concatena.
      imgCode = backendProd.imagenUrl.startsWith('http')
        ? backendProd.imagenUrl
        : BUCKET_URL + backendProd.imagenUrl;
    }

    let specsMapeadas: { label: string; value: any }[] = [];

    if (backendProd.especificaciones) {
      try {
        const specsArray =
          typeof backendProd.especificaciones === 'string'
            ? JSON.parse(backendProd.especificaciones)
            : backendProd.especificaciones;

        if (Array.isArray(specsArray)) {
          specsMapeadas = specsArray.map((item: any) => ({
            label: item.propiedad || 'Detalle',
            value: item.valor || '-',
          }));
        } else {
          specsMapeadas = Object.keys(specsArray).map((key) => ({
            label: key,
            value:
              typeof specsArray[key] === 'object'
                ? JSON.stringify(specsArray[key])
                : specsArray[key],
          }));
        }
      } catch (e) {
        specsMapeadas = [{ label: 'Detalles', value: backendProd.especificaciones }];
      }
    } else {
      specsMapeadas = [{ label: 'Detalles', value: 'Sin especificaciones registradas' }];
    }

    const price = backendProd.precio || 0;

    return {
      id: backendProd.id,
      name: backendProd.nombre,
      brand: backendProd.marca || 'Genérico',
      category: backendProd.categoria?.nombre || 'General',
      categoryId: backendProd.categoria?.id,
      price: price,
      img: imgCode,
      imgs: [imgCode],
      badge: backendProd.stock < 5 && backendProd.stock > 0 ? 'ÚLTIMOS' : null,
      stock: backendProd.stock > 0,
      stockReal: backendProd.stock,
      rating: 4.8,
      description: backendProd.descripcion,
      specs: specsMapeadas,
      includes: ['Manual de usuario', 'Garantía del fabricante'],
      sku: `SKU-${backendProd.id.toString().padStart(5, '0')}`,
    };
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price);
  }

  increaseQty(): void {
    const p = this.product();
    if (p && this.quantity() < p.stockReal) {
      this.quantity.update((q) => q + 1);
    }
  }

  decreaseQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  addToCart(): void {
    const p = this.product();
    if (p && p.stock) {
      this.cartService.addToCart(p, this.quantity());
      this.quantity.set(1);
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
