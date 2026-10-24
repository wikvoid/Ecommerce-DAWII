import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CheckoutComponent } from './checkout';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { TokenService } from '../../core/services/token.service';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let cartService: CartService;
  let orderService: OrderService;
  let router: Router;

  const mockItem = {
    id: 1,
    name: 'Taladro Percutor 750W',
    price: 250,
    img: 'https://supabase.co/taladro.jpg',
    qty: 2,
    stockReal: 5,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        CartService,
        OrderService,
        TokenService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    orderService = TestBed.inject(OrderService);
    router = TestBed.inject(Router);

    // <--- AGREGA ESTA LÍNEA PARA EVITAR LA ADVERTENCIA DE SCROLL --->
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('debería redirigir al carrito si el usuario entra con el carrito vacío', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    cartService.clearCart();

    component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith(['/cart']);
  });

  it('debería mostrar un mensaje de error si faltan datos obligatorios del titular al intentar comprar', () => {
    cartService.addToCart(mockItem, 1);
    fixture.detectChanges();

    // Dejamos los datos del cliente vacíos adrede
    component.client.fullName = '';
    component.onSubmitOrder();

    expect(component.errorMessage).toContain('Por favor, completa todos los datos del titular');
    expect(component.isProcessing).toBe(false);
  });

  it('debería enviar el DTO correcto al OrderService y redirigir a confirmación en caso de éxito', () => {
    cartService.addToCart(mockItem, 1);
    fixture.detectChanges();

    // Llenamos los datos requeridos
    component.client = {
      fullName: 'Victor Marquezado',
      dni: '72458912',
      email: 'victor@cibertec.pe',
      phone: '987654321',
    };
    component.paymentMethod = 'card';
    component.cardData = {
      number: '4557123456789012',
      name: 'Victor M',
      expiry: '12/28',
      cvv: '123',
    };

    const respuestaMock = { id: 777, estado: 'COMPLETADO' };
    const crearOrdenSpy = vi.spyOn(orderService, 'crearOrden').mockReturnValue(of(respuestaMock));
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onSubmitOrder();

    expect(crearOrdenSpy).toHaveBeenCalled();
    // Validamos que el carrito se limpie tras el éxito
    expect(cartService.cartItems().length).toBe(0);
    expect(navigateSpy).toHaveBeenCalledWith(['/order-confirmation'], {
      queryParams: { orderId: 777 },
    });
  });

  it('debería capturar el error del backend si la orden falla (ej. problemas de stock)', () => {
    cartService.addToCart(mockItem, 1);
    fixture.detectChanges();

    component.client = {
      fullName: 'Victor Marquezado',
      dni: '72458912',
      email: 'victor@cibertec.pe',
      phone: '987654321',
    };
    component.paymentMethod = 'card';
    component.cardData = {
      number: '4557123456789012',
      name: 'Victor M',
      expiry: '12/28',
      cvv: '123',
    };

    const errorMock = { error: { message: 'Stock insuficiente para el producto solicitado' } };
    vi.spyOn(orderService, 'crearOrden').mockReturnValue(throwError(() => errorMock));

    component.onSubmitOrder();

    expect(component.isProcessing).toBe(false);
    expect(component.errorMessage).toBe('Stock insuficiente para el producto solicitado');
  });
});
