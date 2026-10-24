import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OrderConfirmationComponent } from './order_confirmation';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderConfirmationComponent],
      providers: [
        provideRouter([
          { path: 'catalog', component: OrderConfirmationComponent },
          { path: 'home', component: OrderConfirmationComponent },
        ]),
        provideLocationMocks(),
        // 1. Forzamos un ID estático en la URL simulada para evitar el Math.random()
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ orderId: 777 }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    // 2. Preparamos el sessionStorage ANTES de que Angular renderice la vista por primera vez
    sessionStorage.setItem('lastOrderTotal', '450');

    // 3. Disparamos la detección de cambios (esto ejecuta ngOnInit automáticamente)
    fixture.detectChanges();
  });

  it('debería crearse correctamente el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar los datos de la orden correctamente', () => {
    // Ya no llamamos a component.ngOnInit() manualmente, Angular ya lo hizo en el beforeEach
    expect(component.order).toBeTruthy();
    expect(component.order.total).toBe(450);
    expect(component.order.orderNumber).toBe('ORD-000777'); // Comprobación exacta
  });

  it('debería formatear correctamente los precios en soles (PEN)', () => {
    const precioFormateado = component.formatPrice(1250.5);
    expect(precioFormateado).toContain('S/');
  });

  it('debería navegar al catálogo al hacer clic en seguir comprando', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToCatalog();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalog']);
  });

  it('debería navegar al inicio al hacer clic en ir al inicio', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToHome();
    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });
});
