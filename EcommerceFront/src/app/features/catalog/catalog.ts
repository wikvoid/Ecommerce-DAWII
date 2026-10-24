import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, PaginationComponent],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.css'],
})
export class CatalogComponent implements OnInit {
  viewMode: 'grid' | 'list' = 'grid';
  sortBy = 'relevance';
  searchQuery = '';

  selectedCategory: string | null = null;
  selectedSubcat: string | null = null;
  selectedBrand: string | null = null;
  onlyStock = false;
  maxPrice = 200000;

  categories: string[] = [];
  brands: string[] = [];
  allProducts: any[] = [];
  filteredProducts: any[] = [];
  isLoading = true;

  paginatedProducts: any[] = [];
  currentPage = 1;
  pageSize = 9;
  totalPages = 1;

  private productService = inject(ProductService);
  public cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // CONSTANTE DE SUPABASE PARA ARMAR LA URL
  private readonly BUCKET_URL =
    'https://zelzkdnwqteejirqhvve.supabase.co/storage/v1/object/public/productos/';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['categoria']) this.selectedCategory = params['categoria'];
      if (params['search']) this.searchQuery = params['search'];

      this.cargarProductos();
    });
  }

  cargarProductos(): void {
    this.isLoading = true;

    this.productService.obtenerProductos().subscribe({
      next: (data: any[]) => {
        this.allProducts = data.map((p) => this.mapearProductoParaVista(p));

        // Extracción dinámica desde la Base de Datos
        this.categories = [...new Set(this.allProducts.map((p) => p.category).filter(Boolean))];
        this.brands = [...new Set(this.allProducts.map((p) => p.brand).filter(Boolean))];

        this.aplicarFiltros();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar catálogo', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  mapearProductoParaVista(backendProd: any): any {
    const randomBrand = backendProd.marca || this.brands[backendProd.id % this.brands.length];

    // CONCATENACIÓN INTELIGENTE DE IMAGEN
    let imgCode = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
    if (backendProd.imagenUrl) {
      imgCode = backendProd.imagenUrl.startsWith('http')
        ? backendProd.imagenUrl
        : this.BUCKET_URL + backendProd.imagenUrl;
    }

    // Calculamos si tiene porcentaje de descuento para mostrar o no
    const oldPrice = backendProd.precio * 1.15;

    return {
      id: backendProd.id,
      name: backendProd.nombre,
      description: backendProd.descripcion,
      price: backendProd.precio,
      // Solo mostramos precio viejo si queremos simular descuento. En producción, eliminar si no hay oldPrice real.
      oldPrice: oldPrice,
      badge: backendProd.stock < 5 && backendProd.stock > 0 ? 'ÚLTIMOS' : null,
      stock: backendProd.stock > 0,
      stockReal: backendProd.stock,
      brand: randomBrand,
      category: backendProd.categoria?.nombre || 'General',
      img: imgCode, // <-- Asignamos la URL lista para pintar en HTML
      reviews: Math.floor(Math.random() * 50) + 5,
    };
  }

  aplicarFiltros(): void {
    let result = this.allProducts;

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
      );
    }
    if (this.selectedCategory) result = result.filter((p) => p.category === this.selectedCategory);
    if (this.selectedBrand) result = result.filter((p) => p.brand === this.selectedBrand);
    result = result.filter((p) => p.price <= this.maxPrice);
    if (this.onlyStock) result = result.filter((p) => p.stock === true);

    this.filteredProducts = this.ordenarResultados(result);
    this.currentPage = 1;
    this.updatePagination();
  }

  ordenarResultados(lista: any[]): any[] {
    switch (this.sortBy) {
      case 'price-asc':
        return lista.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return lista.sort((a, b) => b.price - a.price);
      case 'rating':
        return lista.sort((a, b) => b.reviews - a.reviews);
      default:
        return lista;
    }
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  selectCategory(cat: string | null): void {
    this.selectedCategory = cat;
    this.aplicarFiltros();
  }

  toggleBrand(brand: string): void {
    this.selectedBrand = this.selectedBrand === brand ? null : brand;
    this.aplicarFiltros();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = null;
    this.selectedBrand = null;
    this.onlyStock = false;
    this.maxPrice = 200000;
    this.aplicarFiltros();
  }

  removeSubcat(): void {
    this.selectedSubcat = null;
    this.aplicarFiltros();
  }

  getCategoryCount(catName: string): number {
    return this.allProducts.filter((p) => p.category === catName).length;
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  }

  goToDetail(id: number): void {
    this.router.navigate(['/product', id]);
  }
}
