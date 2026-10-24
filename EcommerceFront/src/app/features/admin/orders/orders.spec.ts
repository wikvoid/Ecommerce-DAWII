import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OrdersComponent } from './orders';
import { OrderService } from '../../../core/services/order.service';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;
  let orderService: OrderService;

  const mockBackendOrders = [
    {
      id: 1,
      fecha: '2026-10-17T10:00:00Z',
      estado: 'CREADO',
      total: 150,
      metodoPago: 'Tarjeta',
      estadoPago: 'PAGADO',
      usuario: { nombre: 'Juan Perez', telefono: '999888777', dni: '12345678' },
      detalles: [{ producto: { nombre: 'Taladro' }, cantidad: 1, precioUnitario: 150 }],
    },
    {
      id: 2,
      fecha: '2026-10-16T15:30:00Z',
      estado: 'COMPLETADO',
      total: 50,
      metodoPago: 'Efectivo',
      estadoPago: 'PENDIENTE',
      usuario: { nombre: 'Maria Gomez', telefono: '111222333', dni: '87654321' },
      detalles: [{ producto: { nombre: 'Clavos' }, cantidad: 5, precioUnitario: 10 }],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [OrderService],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    orderService = TestBed.inject(OrderService);
  });

  it('debería inicializarse y cargar órdenes mapeadas correctamente', () => {
    vi.spyOn(orderService, 'obtenerTodasLasOrdenes').mockReturnValue(of(mockBackendOrders));

    fixture.detectChanges(); // Ejecuta ngOnInit

    expect(component.orders.length).toBe(2);
    expect(component.orders[0].id).toBe('FM-0001');
    expect(component.orders[0].customer).toBe('Juan Perez');
    expect(component.orders[0].status).toBe('Nuevo'); // CREADO mapeado a Nuevo
    expect(component.orders[0].items).toBe(1);

    expect(component.orders[1].status).toBe('Entregado'); // COMPLETADO mapeado a Entregado
  });

  it('debería filtrar órdenes por estado', () => {
    vi.spyOn(orderService, 'obtenerTodasLasOrdenes').mockReturnValue(of(mockBackendOrders));
    fixture.detectChanges();

    component.filterStatus = 'Nuevo';
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].customer).toBe('Juan Perez');
  });

  it('debería filtrar órdenes por búsqueda', () => {
    vi.spyOn(orderService, 'obtenerTodasLasOrdenes').mockReturnValue(of(mockBackendOrders));
    fixture.detectChanges();

    component.searchQuery = 'maria';
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].customer).toBe('Maria Gomez');
  });

  it('debería abrir y cerrar los detalles de una orden', () => {
    vi.spyOn(orderService, 'obtenerTodasLasOrdenes').mockReturnValue(of(mockBackendOrders));
    fixture.detectChanges();

    component.openOrderDetails(component.orders[0]);
    expect(component.selectedOrder).toBeTruthy();
    expect(component.selectedOrder?.id).toBe('FM-0001');

    component.closeOrderDetails();
    expect(component.selectedOrder).toBeNull();
  });

  it('debería actualizar el estado de una orden en la vista', () => {
    vi.spyOn(orderService, 'obtenerTodasLasOrdenes').mockReturnValue(of(mockBackendOrders));
    fixture.detectChanges();

    // Abrimos la primera orden (que es 'Nuevo')
    component.openOrderDetails(component.orders[0]);

    // Cambiamos el estado a 'Preparando'
    component.updateOrderStatus('Preparando');

    // Verificamos que se actualizó tanto en el objeto seleccionado como en la lista principal
    expect(component.selectedOrder?.status).toBe('Preparando');
    expect(component.orders[0].status).toBe('Preparando');
  });
});
