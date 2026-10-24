import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  img: string;
  qty: number;
  stockReal: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  public cartItems = signal<CartItem[]>([]);

  // Signals computados para el Navbar y el Resumen de Compra
  public cartCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.qty, 0));

  public subtotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.price * item.qty, 0),
  );

  public total = computed(() => this.subtotal());

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const savedCart = localStorage.getItem('ferremas_cart');
    if (savedCart) {
      try {
        this.cartItems.set(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error al leer el carrito del storage', e);
        this.cartItems.set([]);
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('ferremas_cart', JSON.stringify(this.cartItems()));
  }

  // Soporta tanto objetos mapeados del Home (name, price) como entidades de BD (nombre, precio)
  addToCart(producto: any, quantity: number = 1): void {
    const items = [...this.cartItems()];
    const existingIndex = items.findIndex((item) => item.id === producto.id);
    const stockDisponible = producto.stockReal ?? producto.stock ?? 0;

    if (existingIndex !== -1) {
      const newQty = items[existingIndex].qty + quantity;
      if (newQty <= items[existingIndex].stockReal) {
        items[existingIndex].qty = newQty;
      } else {
        alert('No hay suficiente stock disponible para agregar más unidades.');
        return;
      }
    } else {
      items.push({
        id: producto.id,
        name: producto.name || producto.nombre,
        price: Number(producto.price ?? producto.precio),
        img:
          producto.img ||
          producto.imagenUrl ||
          'https://via.placeholder.com/400x300?text=Sin+Imagen',
        qty: quantity,
        stockReal: stockDisponible,
      });
    }

    this.cartItems.set(items);
    this.saveToStorage();
  }

  updateQuantity(productId: number, newQty: number): void {
    if (newQty < 1) return;

    const items = [...this.cartItems()];
    const itemIndex = items.findIndex((i) => i.id === productId);

    if (itemIndex !== -1) {
      if (newQty <= items[itemIndex].stockReal) {
        items[itemIndex].qty = newQty;
        this.cartItems.set(items);
        this.saveToStorage();
      } else {
        alert(`Solo tenemos ${items[itemIndex].stockReal} unidades en stock.`);
      }
    }
  }

  removeItem(productId: number): void {
    const items = this.cartItems().filter((item) => item.id !== productId);
    this.cartItems.set(items);
    this.saveToStorage();
  }

  clearCart(): void {
    this.cartItems.set([]);
    localStorage.removeItem('ferremas_cart');
  }
}
