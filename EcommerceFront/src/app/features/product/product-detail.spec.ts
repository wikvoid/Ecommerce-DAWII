import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ProductDetailComponent } from './product-detail';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let productService: ProductService;
  let cartService: CartService;
  let router: Router;

  const mockBackendProduct = {
    id: 1,
    nombre: 'Taladro Percutor',
    marca: 'Bosch',
    descripcion: 'Taladro de alta potencia',
    precio: 250,
    stock: 5,
    imagenUrl: 'https://supabase.co/taladro.jpg',
    categoria: { id: 1, nombre: 'Herramientas' },
    especificaciones: '{"Potencia":"750W", "Peso":"2kg"}',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        // Simulamos que la URL es /product/1
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of({ get: () => '1' }) },
        },
        ProductService,
        CartService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
    cartService = TestBed.inject(CartService);
    router = TestBed.inject(Router);

    // Evitamos el error de consola por el scroll
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('debería crearse el componente', () => {
    // Evitamos que intente cargar antes de espiar
    vi.spyOn(productService, 'obtenerProductoPorId').mockReturnValue(of(mockBackendProduct));
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of([mockBackendProduct]));

    expect(component).toBeTruthy();
  });

  it('debería cargar y mapear el producto correctamente al iniciar', () => {
    vi.spyOn(productService, 'obtenerProductoPorId').mockReturnValue(of(mockBackendProduct));
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of([])); // Sin relacionados para este test

    fixture.detectChanges(); // Dispara ngOnInit

    expect(component.product).toBeTruthy();
    expect(component.product.name).toBe('Taladro Percutor');
    expect(component.product.price).toBe(250);
    expect(component.product.stockReal).toBe(5);
    // Verifica que el JSON de especificaciones se parseó bien
    expect(component.product.specs.length).toBe(2);
    expect(component.product.specs[0].label).toBe('Potencia');
  });

  it('debería redirigir al home si ocurre un error al cargar el producto', () => {
    vi.spyOn(productService, 'obtenerProductoPorId').mockReturnValue(
      throwError(() => new Error('No encontrado')),
    );
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });

  it('debería sumar y restar la cantidad respetando el límite de stock real', () => {
    vi.spyOn(productService, 'obtenerProductoPorId').mockReturnValue(of(mockBackendProduct));
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of([]));
    fixture.detectChanges();

    expect(component.quantity).toBe(1);

    component.increaseQty();
    expect(component.quantity).toBe(2);

    // Intentamos sobrepasar el stock (que es 5)
    component.quantity = 5;
    component.increaseQty();
    expect(component.quantity).toBe(5); // No debe subir a 6

    component.decreaseQty();
    expect(component.quantity).toBe(4);
  });

  it('debería agregar la cantidad seleccionada al carrito', () => {
    vi.spyOn(productService, 'obtenerProductoPorId').mockReturnValue(of(mockBackendProduct));
    vi.spyOn(productService, 'obtenerProductos').mockReturnValue(of([]));
    const addToCartSpy = vi.spyOn(cartService, 'addToCart');

    fixture.detectChanges();
    component.quantity = 3;
    component.addToCart();

    expect(addToCartSpy).toHaveBeenCalledWith(component.product, 3);
    expect(component.quantity).toBe(1); // Debe reiniciarse a 1 tras agregar
  });
});
