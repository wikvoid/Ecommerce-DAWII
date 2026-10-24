import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CartComponent } from './cart';
import { CartService } from '../../core/services/cart.service';
import { TokenService } from '../../core/services/token.service';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cartService: CartService;
  let tokenService: TokenService;
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
      imports: [CartComponent],
      providers: [provideRouter([]), CartService, TokenService],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('debería crearse correctamente el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar el estado vacío cuando no hay productos en el carrito', () => {
    cartService.clearCart();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-cart-title')?.textContent).toContain(
      'Tu carrito está vacío',
    );
  });

  it('debería listar los productos y calcular los totales cuando el carrito tiene elementos', () => {
    cartService.addToCart(mockItem, 2);
    fixture.detectChanges();

    expect(cartService.cartItems().length).toBe(1);
    expect(cartService.cartCount()).toBe(2);
    expect(cartService.subtotal()).toBe(500);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.item-name')?.textContent).toContain('Taladro Percutor');
  });

  it('debería permitir actualizar la cantidad o eliminar elementos desde la interfaz', () => {
    cartService.addToCart(mockItem, 1);

    component.cartService.updateQuantity(mockItem.id, 3);
    expect(cartService.cartItems()[0].qty).toBe(3);

    component.cartService.removeItem(mockItem.id);
    expect(cartService.cartItems().length).toBe(0);
  });

  it('debería redirigir al login con returnUrl si intenta finalizar compra sin sesión activa', () => {
    cartService.addToCart(mockItem, 1);

    // Usamos el espía moderno de Vitest
    vi.spyOn(tokenService, 'isLogged').mockReturnValue(false);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onCheckout();

    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/checkout' },
    });
  });

  it('debería redirigir al checkout si el usuario ya está autenticado', () => {
    cartService.addToCart(mockItem, 1);

    // Usamos el espía moderno de Vitest
    vi.spyOn(tokenService, 'isLogged').mockReturnValue(true);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onCheckout();

    expect(navigateSpy).toHaveBeenCalledWith(['/checkout']);
  });
});
