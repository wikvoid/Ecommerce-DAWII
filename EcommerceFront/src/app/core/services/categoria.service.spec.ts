import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriaService } from './categoria.service';

describe('CategoriaService', () => {
  let service: CategoriaService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/api/categorias';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoriaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería obtener todas las categorías (GET /api/categorias)', () => {
    const mockCategorias = [
      { id: 1, nombre: 'Herramientas Eléctricas', imagenUrl: 'https://supabase.co/cat1.jpg' },
      { id: 2, nombre: 'Construcción', imagenUrl: 'https://supabase.co/cat2.jpg' },
    ];

    service.obtenerCategorias().subscribe((cats) => {
      expect(cats.length).toBe(2);
      expect(cats[0].nombre).toBe('Herramientas Eléctricas');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategorias);
  });

  it('debería crear una nueva categoría con su imagenUrl (POST /api/categorias)', () => {
    const nuevaCat = { nombre: 'Pinturas', imagenUrl: 'https://supabase.co/pinturas.jpg' };

    service.crearCategoria(nuevaCat).subscribe((res) => {
      expect(res.id).toBe(3);
      expect(res.nombre).toBe('Pinturas');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevaCat);
    req.flush({ id: 3, ...nuevaCat });
  });

  it('debería eliminar una categoría (DELETE /api/categorias/3)', () => {
    service.eliminarCategoria(3).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
