import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosTicketComponent } from '../../../shared/components/pos-ticket/pos-ticket';
import { ProductService } from '../../../core/services/product.service';
import { NuevaOrdenDTO, OrderService } from '../../../core/services/order.service';
import { TokenService } from '../../../core/services/token.service';
import { HttpClient } from '@angular/common/http';

export interface PosProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  img: string;
}

export interface CartLine {
  product: PosProduct;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface PosToast {
  type: 'success' | 'error';
  title: string;
  message: string;
}

export type PaymentMethodType = 'EFECTIVO' | 'YAPE' | 'TARJETA';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, PosTicketComponent],
  templateUrl: './pos.html',
  styleUrls: ['./pos.css'],
})
export class PosComponent implements OnInit {
  // --- ESTADO REACTIVO ---
  products = signal<PosProduct[]>([]);
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('Todas');

  cart = signal<CartLine[]>([]);

  docType = signal<'Boleta' | 'Factura'>('Boleta');
  customerName = signal<string>('Público General');
  customerDoc = signal<string>('00000000');

  // Modales y formularios
  isCustomerModalOpen = signal<boolean>(false);
  newCustomer = signal({
    name: '',
    docType: 'DNI' as 'DNI' | 'RUC',
    docNumber: '',
    phone: '',
    email: '',
  });

  isPaymentModalOpen = signal<boolean>(false);
  selectedPaymentMethod = signal<PaymentMethodType>('EFECTIVO');
  cashGiven = signal<number>(0);
  operationRef = signal<string>('');
  lastCompletedSale = signal<any>(null);

  toast: PosToast | null = null;
  private toastTimeout: any = null;

  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);
  private orderService = inject(OrderService);
  private tokenService = inject(TokenService);
  private http = inject(HttpClient);

  private readonly BUCKET_URL =
    'https://zelzkdnwqteejirqhvve.supabase.co/storage/v1/object/public/productos/';

  // --- COMPUTADOS ---
  categories = computed(() => {
    const cats = this.products().map((p) => p.category);
    return ['Todas', ...new Set(cats)];
  });

  filteredProducts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    return this.products().filter((p) => {
      const matchCat = cat === 'Todas' || p.category === cat;
      const matchText =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  });

  totalAmount = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.subtotal, 0);
  });

  changeDue = computed(() => {
    if (this.selectedPaymentMethod() !== 'EFECTIVO') return 0;
    const diff = (Number(this.cashGiven()) || 0) - this.totalAmount();
    return diff > 0 ? diff : 0;
  });

  // --- INICIALIZACIÓN ---
  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.productService.obtenerProductos().subscribe({
      next: (data) => {
        const mapeados: PosProduct[] = data.map((p: any) => {
          let imgSrc = 'https://via.placeholder.com/300x300?text=Sin+Imagen';
          if (p.imagenUrl) {
            imgSrc = p.imagenUrl.startsWith('http') ? p.imagenUrl : this.BUCKET_URL + p.imagenUrl;
          }

          return {
            id: p.id,
            name: p.nombre,
            brand: p.marca || 'Genérico',
            category: p.categoria?.nombre || 'General',
            price: p.precio,
            stock: p.stock,
            sku: p.codigo || `SKU-${p.id}`,
            img: imgSrc,
          };
        });
        this.products.set(mapeados);
      },
      error: (err) => console.error('Error al cargar productos POS', err),
    });
  }

  // --- INTERACCIONES DEL CARRITO ---
  addToCart(p: PosProduct): void {
    if (p.stock <= 0) {
      this.showToast('error', 'Sin Stock', 'No hay existencias disponibles en almacén.');
      return;
    }

    this.cart.update((currentCart) => {
      const existing = currentCart.find((c) => c.product.id === p.id);
      if (existing) {
        if (existing.qty < p.stock) {
          existing.qty++;
          // CORRECCIÓN DEL ERROR MATEMÁTICO: agregado el *
          existing.subtotal = existing.qty * existing.unitPrice;
        } else {
          this.showToast('error', 'Límite de Stock', 'Inventario máximo alcanzado.');
        }
        return [...currentCart];
      } else {
        return [...currentCart, { product: p, qty: 1, unitPrice: p.price, subtotal: p.price }];
      }
    });
  }

  increaseQty(item: CartLine): void {
    if (item.qty < item.product.stock) {
      this.cart.update((current) => {
        const target = current.find((c) => c.product.id === item.product.id);
        if (target) {
          target.qty++;
          target.subtotal = target.qty * target.unitPrice;
        }
        return [...current];
      });
    } else {
      this.showToast('error', 'Límite alcanzado', `Solo hay ${item.product.stock} unidades.`);
    }
  }

  decreaseQty(item: CartLine): void {
    if (item.qty > 1) {
      this.cart.update((current) => {
        const target = current.find((c) => c.product.id === item.product.id);
        if (target) {
          target.qty--;
          target.subtotal = target.qty * target.unitPrice;
        }
        return [...current];
      });
    } else {
      this.removeFromCart(item);
    }
  }

  removeFromCart(item: CartLine): void {
    this.cart.update((current) => current.filter((c) => c.product.id !== item.product.id));
  }

  // --- MÉTODOS AUXILIARES ---
  formatPrice(val: number): string {
    return (
      'S/ ' +
      (val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  selectDocType(type: 'Boleta' | 'Factura'): void {
    if (type === 'Factura' && this.customerDoc().length !== 11) {
      this.newCustomer.set({ name: '', docType: 'RUC', docNumber: '', phone: '', email: '' });
      this.isCustomerModalOpen.set(true);
      this.showToast(
        'error',
        'Factura Requiere RUC',
        'Por favor ingresa los datos fiscales de la empresa.',
      );
      return;
    }
    this.docType.set(type);
  }

  onBarcodeScanned(): void {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return;

    // Busca coincidencia exacta por SKU o Código de Barras
    const match = this.products().find((p) => p.sku.toLowerCase() === query);

    if (match) {
      this.addToCart(match);
      this.searchQuery.set(''); // Limpia para el siguiente escaneo
    } else {
      this.showToast(
        'error',
        'No encontrado',
        'El código escaneado no coincide con ningún producto.',
      );
    }
  }

  // --- MODAL CLIENTE ---
  openCustomerModal(): void {
    this.newCustomer.set({
      name: '',
      docType: this.docType() === 'Factura' ? 'RUC' : 'DNI',
      docNumber: '',
      phone: '',
      email: '',
    });
    this.isCustomerModalOpen.set(true);
  }

  buscarClienteBD(): void {
    const doc = this.newCustomer().docNumber.trim();
    if (!doc) {
      this.showToast('error', 'Campo Vacío', 'Ingresa un número de documento primero.');
      return;
    }
    this.http.get<any>(`http://localhost:8080/api/usuarios/buscar-dni/${doc}`).subscribe({
      next: (data) => {
        // Autocompleta los campos si lo encuentra
        this.newCustomer.update((c) => ({
          ...c,
          name: data.nombreCompleto || data.nombre || data.email, // Ajusta según tus campos reales
          email: data.email || '',
          phone: data.telefono || '',
        }));
        this.showToast('success', 'Cliente Encontrado', 'Datos autocompletados desde el registro.');
      },
      error: () => {
        this.showToast(
          'error',
          'No Registrado',
          'El documento no existe. Ingrese los datos manualmente.',
        );
      },
    });
  }

  closeCustomerModal(): void {
    this.isCustomerModalOpen.set(false);
    if (this.docType() === 'Factura' && this.customerDoc().length !== 11) {
      this.docType.set('Boleta');
    }
  }

  saveCustomer(): void {
    const cust = this.newCustomer();
    if (!cust.name.trim() || !cust.docNumber.trim()) {
      this.showToast('error', 'Campos vacíos', 'Ingresa el nombre/razón social y documento.');
      return;
    }
    if (cust.docType === 'RUC' && cust.docNumber.trim().length !== 11) {
      this.showToast('error', 'RUC Inválido', 'El RUC debe tener 11 dígitos numéricos.');
      return;
    }

    this.customerName.set(cust.name.trim());
    this.customerDoc.set(cust.docNumber.trim());
    if (cust.docType === 'RUC') this.docType.set('Factura');

    this.isCustomerModalOpen.set(false);
    this.showToast('success', 'Cliente Actualizado', `Asignado a la venta actual.`);
  }

  // --- MODAL PAGO ---
  openPaymentModal(): void {
    if (this.cart().length === 0) {
      this.showToast('error', 'Carrito vacío', 'Agrega productos a la orden.');
      return;
    }

    // REGLA 1: Factura exige RUC válido de 11 dígitos
    if (this.docType() === 'Factura') {
      const ruc = this.customerDoc().trim();
      if (ruc.length !== 11 || (!ruc.startsWith('10') && !ruc.startsWith('20'))) {
        this.showToast('error', 'RUC Inválido', 'La Factura requiere un RUC válido de 11 dígitos.');
        return;
      }
      if (!this.customerName().trim() || this.customerName() === 'Público General') {
        this.showToast(
          'error',
          'Razón Social',
          'La Factura requiere la Razón Social de la empresa.',
        );
        return;
      }
    }

    // REGLA 2: Boletas mayores a S/ 700 exigen DNI obligatorio por SUNAT
    if (this.docType() === 'Boleta' && this.totalAmount() >= 700) {
      if (!this.customerDoc() || this.customerDoc() === '00000000') {
        this.showToast(
          'error',
          'Identificación Obligatoria',
          'Ventas mayores a S/ 700 requieren DNI obligatoriamente.',
        );
        return;
      }
    }

    this.selectedPaymentMethod.set('EFECTIVO');
    this.cashGiven.set(this.totalAmount());
    this.operationRef.set('');
    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    this.isPaymentModalOpen.set(false);
  }

  setPaymentMethod(method: PaymentMethodType): void {
    this.selectedPaymentMethod.set(method);
    if (method === 'EFECTIVO') this.cashGiven.set(this.totalAmount());
  }

  setQuickCash(amount: number): void {
    this.cashGiven.set(amount);
  }

  updateCustomerField(field: string, value: string): void {
    this.newCustomer.update((c) => ({ ...c, [field]: value }));
  }

  showToast(type: 'success' | 'error', title: string, message: string): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = { type, title, message };
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 3200);
  }

  buscarClienteRapido(): void {
    const doc = this.customerDoc().trim();

    if (!doc) {
      this.showToast('error', 'Campo Vacío', 'Ingresa un número de documento para buscar.');
      return;
    }

    // Llamada a tu API en Spring Boot
    this.http.get<any>(`http://localhost:8080/api/usuarios/buscar-dni/${doc}`).subscribe({
      next: (data) => {
        // Extraemos el nombre según cómo lo devuelva tu backend
        const nombreEncontrado =
          data.nombreCompleto || data.nombre || data.email || 'Cliente Encontrado';

        // Actualizamos directamente el input de la cabecera
        this.customerName.set(nombreEncontrado);
        this.showToast('success', 'Cliente Encontrado', 'Datos cargados correctamente.');
      },
      error: () => {
        this.showToast(
          'error',
          'No Encontrado',
          'El documento no existe en la base de datos. Puedes escribir el nombre manualmente abajo.',
        );
        // Dejamos el foco libre para que el cajero simplemente escriba el nombre en el input
      },
    });
  }

  confirmSale(): void {
    const method = this.selectedPaymentMethod();

    // Validación Efectivo
    if (method === 'EFECTIVO' && this.cashGiven() < this.totalAmount()) {
      this.showToast('error', 'Monto insuficiente', 'El efectivo entregado no cubre el total.');
      return;
    }

    // Validación Pagos Digitales (Obliga a ingresar el voucher)
    if ((method === 'YAPE' || method === 'TARJETA') && !this.operationRef().trim()) {
      const fieldName =
        method === 'YAPE' ? 'N° de Operación de Yape/Plin' : 'N° de Referencia del POS';
      this.showToast(
        'error',
        'Falta validación',
        `Ingresa el ${fieldName} para registrar el pago.`,
      );
      return;
    }

    const currentCart = this.cart();

    // 1. Obtenemos el ID del cajero/vendedor logueado
    const userId = this.tokenService.getUserId() || 1; // Fallback por seguridad

    // 2. Armamos el paquete de datos para Spring Boot
    const dto: NuevaOrdenDTO = {
      usuarioId: userId,
      items: currentCart.map((c) => ({
        productoId: c.product.id,
        cantidad: c.qty,
      })),
      tipoComprobante: this.docType(),
      nombreCliente: this.customerName(),
      documentoCliente: this.customerDoc(),
      canal: 'Tienda (POS)',
      metodoPago:
        this.selectedPaymentMethod() === 'EFECTIVO'
          ? 'Efectivo'
          : this.selectedPaymentMethod() === 'YAPE'
            ? 'Yape / Plin'
            : 'Tarjeta POS',
    };

    // 3. Enviamos la orden real a la base de datos
    this.orderService.crearOrden(dto).subscribe({
      next: (respuestaOrden) => {
        // Descuento local de stock para la vista
        currentCart.forEach((c) => (c.product.stock -= c.qty));

        // Armamos la serie usando el ID real generado por la base de datos
        const realId = respuestaOrden.id.toString().padStart(6, '0');
        const prefix = this.docType() === 'Factura' ? 'F001-' : 'B001-';

        this.lastCompletedSale.set({
          docType: this.docType(),
          series: prefix + realId,
          customer: this.customerName(),
          docNumber: this.customerDoc(),
          date:
            new Date().toLocaleDateString('es-PE') +
            ' ' +
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          paymentMethod:
            this.selectedPaymentMethod() === 'EFECTIVO'
              ? 'Efectivo'
              : this.selectedPaymentMethod() === 'YAPE'
                ? 'Yape / Plin'
                : 'Tarjeta POS',
          operationRef: this.operationRef(),
          items: [...currentCart],
          total: this.totalAmount(),
          cashGiven: this.cashGiven(),
          change: this.changeDue(),
        });

        // Limpiamos la caja
        this.isPaymentModalOpen.set(false);
        this.cart.set([]);
        this.customerName.set('Público General');
        this.customerDoc.set('00000000');
        this.docType.set('Boleta');
        this.toast = null;

        // 4. Imprimimos el ticket solo cuando la BD confirmó la compra
        setTimeout(() => {
          window.print();
        }, 400);
      },
      error: (err) => {
        console.error('Error al registrar venta POS:', err);
        this.showToast(
          'error',
          'Error del Servidor',
          'No se pudo guardar la venta en la base de datos.',
        );
      },
    });
  }
  // Al presionar F12 en cualquier lugar de la pantalla, abre la caja
  @HostListener('window:keydown.f12', ['$event'])
  handleF12(event: Event) {
    // <-- Cambiado de KeyboardEvent a Event
    event.preventDefault();
    if (!this.isPaymentModalOpen()) {
      this.openPaymentModal();
    }
  }

  // Al presionar Enter mientras el modal de pago está abierto, confirma la venta
  @HostListener('window:keydown.enter', ['$event'])
  handleEnter(event: Event) {
    // <-- Cambiado de KeyboardEvent a Event
    if (this.isPaymentModalOpen()) {
      event.preventDefault();
      this.confirmSale();
    }
  }
}
