import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService, NuevaOrdenDTO } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/api/ordenes';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crear una orden enviando usuarioId e items (POST /api/ordenes)', () => {
    const nuevaOrden: NuevaOrdenDTO = {
      usuarioId: 5,
      items: [
        { productoId: 1, cantidad: 2 },
        { productoId: 4, cantidad: 1 },
      ],
    };

    const mockRespuesta = { id: 100, estado: 'PENDIENTE', total: 560 };

    service.crearOrden(nuevaOrden).subscribe((res) => {
      expect(res.id).toBe(100);
      expect(res.estado).toBe('PENDIENTE');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevaOrden);
    req.flush(mockRespuesta);
  });

  it('debería listar todas las órdenes para el administrador (GET /api/ordenes)', () => {
    const mockOrdenes = [
      { id: 100, total: 560 },
      { id: 101, total: 120 },
    ];

    service.obtenerTodasLasOrdenes().subscribe((ordenes) => {
      expect(ordenes.length).toBe(2);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrdenes);
  });

  it('debería obtener el historial de órdenes de un cliente (GET /api/ordenes/usuario/5)', () => {
    const mockOrdenesCliente = [{ id: 100, usuarioId: 5, total: 560 }];

    service.obtenerOrdenesPorUsuario(5).subscribe((ordenes) => {
      expect(ordenes.length).toBe(1);
      expect(ordenes[0].usuarioId).toBe(5);
    });

    const req = httpMock.expectOne(`${apiUrl}/usuario/5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrdenesCliente);
  });
});
