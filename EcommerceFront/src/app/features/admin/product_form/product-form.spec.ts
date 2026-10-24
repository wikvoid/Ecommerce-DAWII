import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ProductFormComponent } from './product_form';
import { ProductService } from '../../../core/services/product.service';
import { CategoriaService } from '../../../core/services/categoria.service';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productService: ProductService;
  let categoriaService: CategoriaService;
  let router: Router;

  const mockCategorias = [
    { id: 1, nombre: 'Herramientas' },
    { id: 2, nombre: 'Pinturas' },
  ];

  const mockProductoBackend = {
    id: 10,
    nombre: 'Taladro Test',
    marca: 'Bosch',
    precio: 100,
    categoria: { id: 1, nombre: 'Herramientas' },
    especificaciones: '[{"propiedad":"Potencia","valor":"500W"}]',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of({ get: (key: string) => (key === 'id' ? '10' : null) }) },
        },
        ProductService,
        CategoriaService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
    categoriaService = TestBed.inject(CategoriaService);
    router = TestBed.inject(Router);

    // Silenciamos las alertas del navegador durante el test
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('debería inicializarse en modo edición si recibe un ID en la ruta', () => {
    vi.spyOn(categoriaService, 'obtenerCategorias').mockReturnValue(of(mockCategorias));
    vi.spyOn(productService, 'obtenerProductoPorId').mockReturnValue(of(mockProductoBackend));

    fixture.detectChanges(); // Ejecuta ngOnInit

    expect(component.isEditMode).toBe(true);
    expect(component.productId).toBe(10);
    expect(component.categorias.length).toBe(2);
    expect(component.producto.nombre).toBe('Taladro Test');
    expect(component.producto.categoriaId).toBe(1);
    expect(component.especificaciones[0].propiedad).toBe('Potencia');
  });

  it('debería permitir agregar y eliminar filas de especificaciones', () => {
    component.especificaciones = [{ propiedad: 'A', valor: '1' }];

    component.agregarFila();
    expect(component.especificaciones.length).toBe(2);

    component.eliminarFila(1);
    expect(component.especificaciones.length).toBe(1);

    // Si se intenta eliminar la última, debe vaciarla pero no quitarla
    component.eliminarFila(0);
    expect(component.especificaciones.length).toBe(1);
    expect(component.especificaciones[0].propiedad).toBe('');
  });

  it('debería filtrar especificaciones vacías y llamar a actualizarProducto en modo edición', () => {
    vi.spyOn(categoriaService, 'obtenerCategorias').mockReturnValue(of([]));
    vi.spyOn(productService, 'obtenerProductoPorId').mockReturnValue(of(mockProductoBackend));
    const actualizarSpy = vi.spyOn(productService, 'actualizarProducto').mockReturnValue(of({}));
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.detectChanges(); // Carga el modo edición

    // Agregamos una fila vacía para probar el filtro
    component.agregarFila();
    component.guardarProducto();

    expect(actualizarSpy).toHaveBeenCalled();
    const argsLlamada = actualizarSpy.mock.calls[0][1] as any;
    // Solo debe haberse enviado la especificación original, no la vacía
    expect(argsLlamada.especificaciones).toBe('[{"propiedad":"Potencia","valor":"500W"}]');
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/inventory']);
  });
});
