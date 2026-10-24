import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  const mockProducto = {
    id: 1,
    nombre: 'Taladro Percutor 750W',
    precio: 250,
    imagenUrl: 'https://supabase.co/taladro.jpg',
    stock: 5,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [CartService],
    });
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debería crearse con el carrito vacío', () => {
    expect(service).toBeTruthy();
    expect(service.cartItems().length).toBe(0);
    expect(service.cartCount()).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('debería agregar un producto nuevo y recalcular los signals automáticamente', () => {
    service.addToCart(mockProducto, 2);

    expect(service.cartItems().length).toBe(1);
    expect(service.cartCount()).toBe(2);
    expect(service.subtotal()).toBe(500);
    expect(service.total()).toBe(500);

    // Verificar persistencia en localStorage
    const guardados = JSON.parse(localStorage.getItem('ferremas_cart') || '[]');
    expect(guardados.length).toBe(1);
    expect(guardados[0].qty).toBe(2);
  });

  it('debería sumar la cantidad si el producto ya existe en el carrito', () => {
    service.addToCart(mockProducto, 1);
    service.addToCart(mockProducto, 2);

    expect(service.cartItems().length).toBe(1);
    expect(service.cartCount()).toBe(3);
    expect(service.subtotal()).toBe(750);
  });

  it('no debería permitir agregar más unidades que el stock disponible', () => {
    let mensajeAlerta = '';
    const alertOriginal = window.alert;

    // Interceptamos window.alert manualmente
    window.alert = (msg?: any) => {
      mensajeAlerta = msg;
    };

    service.addToCart(mockProducto, 5); // Al límite del stock (5)
    service.addToCart(mockProducto, 1); // Intenta pasar a 6

    expect(service.cartCount()).toBe(5);
    expect(mensajeAlerta).toBe('No hay suficiente stock disponible para agregar más unidades.');

    // Restauramos el alert original
    window.alert = alertOriginal;
  });

  it('debería actualizar la cantidad de un producto con updateQuantity()', () => {
    service.addToCart(mockProducto, 1);
    service.updateQuantity(1, 4);

    expect(service.cartCount()).toBe(4);
    expect(service.subtotal()).toBe(1000);
  });

  it('debería eliminar un producto del carrito con removeItem()', () => {
    service.addToCart(mockProducto, 2);
    service.removeItem(1);

    expect(service.cartItems().length).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('debería vaciar el carrito y limpiar localStorage con clearCart()', () => {
    service.addToCart(mockProducto, 2);
    service.clearCart();

    expect(service.cartItems().length).toBe(0);
    expect(localStorage.getItem('ferremas_cart')).toBeNull();
  });
});
