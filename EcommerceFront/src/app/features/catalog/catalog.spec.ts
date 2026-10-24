import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CatalogComponent } from './catalog';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

describe('CatalogComponent', () => {
  let component: CatalogComponent;
  let fixture: ComponentFixture<CatalogComponent>;
  let productService: ProductService;
  let cartService: CartService;
  let router: Router;

  // Mock de datos devueltos por Spring Boot
  const mockBackendProducts = [
    {
      id: 1,
      nombre: 'Taladro Percutor',
      marca: 'Bosch',
      descripcion: 'Taladro 750W',
      precio: 250,
      stock: 5,
      imagenUrl: 'taladro.jpg',
      categoria: { nombre: 'Herramientas Eléctricas' },
    },
    {
      id: 2,
      nombre: 'Martillo',
      marca: 'Stanley',
      descripcion: 'Martillo de acero',
      precio: 45,
      stock: 0,
      imagenUrl: 'martillo.jpg',
      categoria: { nombre: 'Herramientas Manuales' },
    },
    {
      id: 3,
      nombre: 'Sierra Circular',
      marca: 'DeWalt',
      descripcion: 'Sierra 1400W',
      precio: 450,
      stock: 12,
      imagenUrl: 'sierra.jpg',
      categoria: { nombre: 'Herramientas Eléctricas' },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) }, // Simulamos URL sin parámetros iniciales
        },
        ProductService,
        CartService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
    cartService = TestBed.inject(CartService);
    router = TestBed.inject(Router);

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('debería crearse correctamente', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of([]));
    expect(component).toBeTruthy();
  });

  it('debería cargar productos, mapearlos y extraer categorías/marcas únicas', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockBackendProducts));

    fixture.detectChanges(); // Dispara ngOnInit y cargarProductos

    expect(component.isLoading).toBe(false);
    expect(component.allProducts.length).toBe(3);

    // Verificamos extracción dinámica
    expect(component.categories).toEqual(['Herramientas Eléctricas', 'Herramientas Manuales']);
    expect(component.brands).toEqual(['Bosch', 'Stanley', 'DeWalt']);
  });

  it('debería filtrar los productos por término de búsqueda', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockBackendProducts));
    fixture.detectChanges();

    component.searchQuery = 'sierra';
    component.aplicarFiltros();

    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].name).toBe('Sierra Circular');
  });

  it('debería filtrar correctamente los productos sin stock', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockBackendProducts));
    fixture.detectChanges();

    component.onlyStock = true;
    component.aplicarFiltros();

    // El martillo tiene stock 0, así que deben quedar solo 2 productos
    expect(component.filteredProducts.length).toBe(2);
    const tieneMartillo = component.filteredProducts.some((p) => p.name === 'Martillo');
    expect(tieneMartillo).toBe(false);
  });

  it('debería ordenar los productos por precio (menor a mayor)', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockBackendProducts));
    fixture.detectChanges();

    component.sortBy = 'price-asc';
    component.aplicarFiltros(); // aplicarFiltros llama a ordenarResultados

    expect(component.filteredProducts[0].name).toBe('Martillo'); // 45
    expect(component.filteredProducts[1].name).toBe('Taladro Percutor'); // 250
    expect(component.filteredProducts[2].name).toBe('Sierra Circular'); // 450
  });

  it('debería limpiar todos los filtros correctamente', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockBackendProducts));
    fixture.detectChanges();

    component.searchQuery = 'taladro';
    component.selectedCategory = 'Herramientas Manuales';
    component.onlyStock = true;

    component.clearFilters();

    expect(component.searchQuery).toBe('');
    expect(component.selectedCategory).toBeNull();
    expect(component.onlyStock).toBe(false);
    expect(component.filteredProducts.length).toBe(3); // Vuelven a aparecer todos
  });
});
