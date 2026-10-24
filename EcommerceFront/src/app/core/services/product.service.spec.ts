import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService, ProductoDTO } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/api/productos';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifica que no queden peticiones HTTP pendientes
    httpMock.verify();
  });

  it('debería listar los productos activos (GET /api/productos)', () => {
    const mockProductos = [
      { id: 1, nombre: 'Taladro Bosch', precio: 250, stock: 10 },
      { id: 2, nombre: 'Amoladora Makita', precio: 180, stock: 4 },
    ];

    service.obtenerProductos().subscribe((productos) => {
      expect(productos.length).toBe(2);
      expect(productos).toEqual(mockProductos);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockProductos);
  });

  it('debería buscar productos por término (GET /api/productos/buscar?termino=taladro)', () => {
    const mockResultado = [{ id: 1, nombre: 'Taladro Bosch', precio: 250 }];

    service.buscarProductos('taladro').subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].nombre).toContain('Taladro');
    });

    const req = httpMock.expectOne(`${apiUrl}/buscar?termino=taladro`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('termino')).toBe('taladro');
    req.flush(mockResultado);
  });

  it('debería obtener un producto por su ID (GET /api/productos/1)', () => {
    const mockProducto = { id: 1, nombre: 'Taladro Bosch', precio: 250 };

    service.obtenerProductoPorId(1).subscribe((prod) => {
      expect(prod.id).toBe(1);
      expect(prod.nombre).toBe('Taladro Bosch');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducto);
  });

  it('debería crear un producto enviando el ProductoDTO (POST /api/productos)', () => {
    const nuevoDto: ProductoDTO = {
      nombre: 'Sierra Circular',
      marca: 'DeWalt',
      descripcion: 'Sierra de 1400W',
      precio: 420,
      stock: 8,
      imagenUrl: 'https://supabase.co/sierra.jpg',
      categoriaId: 1,
      especificaciones: '{"potencia":"1400W"}',
      activo: true,
    };

    service.crearProducto(nuevoDto).subscribe((res) => {
      expect(res.id).toBe(10);
      expect(res.nombre).toBe('Sierra Circular');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevoDto);
    req.flush({ id: 10, ...nuevoDto });
  });

  it('debería actualizar un producto existente (PUT /api/productos/10)', () => {
    const dtoActualizado: ProductoDTO = {
      nombre: 'Sierra Circular Pro',
      marca: 'DeWalt',
      descripcion: 'Sierra de 1600W',
      precio: 450,
      stock: 5,
      imagenUrl: 'https://supabase.co/sierra.jpg',
      categoriaId: 1,
      especificaciones: '{"potencia":"1600W"}',
    };

    service.actualizarProducto(10, dtoActualizado).subscribe((res) => {
      expect(res.nombre).toBe('Sierra Circular Pro');
    });

    const req = httpMock.expectOne(`${apiUrl}/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dtoActualizado);
    req.flush({ id: 10, ...dtoActualizado });
  });

  it('debería realizar el borrado lógico de un producto (DELETE /api/productos/10)', () => {
    service.eliminarProducto(10).subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${apiUrl}/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
