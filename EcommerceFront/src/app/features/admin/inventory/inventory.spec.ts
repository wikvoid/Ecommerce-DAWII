import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { InventoryComponent } from './inventory';
import { ProductService } from '../../../core/services/product.service';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let productService: ProductService;
  let router: Router;

  const mockProductosBackend = [
    {
      id: 1,
      nombre: 'Taladro',
      marca: 'Bosch',
      precio: 200,
      stock: 0, // Sin stock
      categoria: { nombre: 'Herramientas' },
    },
    {
      id: 2,
      nombre: 'Clavos',
      marca: 'Acero',
      precio: 10,
      stock: 50,
      categoria: { nombre: 'Ferretería' },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [provideRouter([]), ProductService],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
    router = TestBed.inject(Router);

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('debería cargar el inventario y extraer categorías dinámicas', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockProductosBackend));

    fixture.detectChanges();

    expect(component.items.length).toBe(2);
    expect(component.dynamicCategories).toContain('Herramientas');
    expect(component.dynamicCategories).toContain('Ferretería');
    expect(component.items[0].sku).toContain('SKU-');
  });

  it('debería filtrar correctamente los productos con stock crítico (vacíos o bajo el mínimo)', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockProductosBackend));
    fixture.detectChanges();

    component.criticalOnly = true;

    // Solo el taladro tiene stock 0 (el mínimo es 5)
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].name).toBe('Taladro');
  });

  it('debería eliminar el producto de la tabla tras confirmarlo con el backend', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockProductosBackend));

    // CAMBIO AQUÍ: Usamos of(undefined) en lugar de of({})
    const eliminarSpy = vi.spyOn(productService, 'eliminarProducto').mockReturnValue(of(undefined));

    fixture.detectChanges();

    component.promptDelete(component.items[1]);
    component.confirmDelete();

    expect(eliminarSpy).toHaveBeenCalledWith(2);
    expect(component.items.length).toBe(1);
    expect(component.itemToDelete).toBeNull();
  });

  it('debería navegar a la pantalla de edición al hacer clic en Editar', () => {
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of(mockProductosBackend));
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();

    component.editProduct(component.items[0]);

    expect(navigateSpy).toHaveBeenCalledWith(['/admin/product-form', 1]);
  });
});
