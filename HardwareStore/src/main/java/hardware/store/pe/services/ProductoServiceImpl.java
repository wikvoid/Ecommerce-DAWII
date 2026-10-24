package hardware.store.pe.services;

import hardware.store.pe.dtos.ProductoDTO;
import hardware.store.pe.models.Categoria;
import hardware.store.pe.models.Producto;
import hardware.store.pe.repositories.CategoriaRepository;
import hardware.store.pe.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile; // <-- Añadido

import java.io.IOException;
import java.util.List;
import java.util.UUID; // <-- Añadido para generar nombres únicos

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    // Inyectamos las credenciales desde properties
    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Override
    public List<Producto> listarActivos() {
        return productoRepository.findByActivoTrue();
    }

    @Override
    public List<Producto> buscarPorCategoria(Integer categoriaId) {
        return productoRepository.findByCategoriaIdAndActivoTrue(categoriaId);
    }

    @Override
    public List<Producto> buscarPorNombre(String termino) {
        return productoRepository.findByNombreContainingIgnoreCaseAndActivoTrue(termino);
    }

    @Override
    public Producto buscarPorId(Integer id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));
    }

    @Override
    public Producto crear(ProductoDTO dto, MultipartFile file) {
        if (file != null && !file.isEmpty()) {
            String nombreArchivoFinal = subirImagenSupabase(file);
            dto.setImagenUrl(nombreArchivoFinal); // Guardamos SOLO el nombre
        }

        Producto nuevoProducto = new Producto();
        mapearDtoAEntidad(dto, nuevoProducto);
        return productoRepository.save(nuevoProducto);
    }

    @Override
    public Producto actualizar(Integer id, ProductoDTO dto, MultipartFile file) {
        Producto productoExistente = buscarPorId(id);

        if (file != null && !file.isEmpty()) {
            String nombreArchivoFinal = subirImagenSupabase(file);
            dto.setImagenUrl(nombreArchivoFinal);
        } else {
            dto.setImagenUrl(productoExistente.getImagenUrl());
        }

        mapearDtoAEntidad(dto, productoExistente);
        return productoRepository.save(productoExistente);
    }

    @Override
    public void eliminarLogico(Integer id) {
        Producto producto = buscarPorId(id);
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    // --- LÓGICA DE SUBIDA A SUPABASE ---
    private String subirImagenSupabase(MultipartFile file) {
        String nombreUnico = UUID.randomUUID().toString() + "-" + file.getOriginalFilename().replace(" ", "_");
        // El bucket es "productos" según tu captura
        String urlDestino = supabaseUrl + "/storage/v1/object/productos/" + nombreUnico;

        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(supabaseKey); // Autenticación
            // Establece el Content-Type correcto según el archivo subido
            headers.setContentType(MediaType.parseMediaType(file.getContentType()));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            // Supabase Storage API espera un POST a la ruta del archivo
            ResponseEntity<String> response = restTemplate.exchange(
                    urlDestino,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Error de Supabase al subir imagen: " + response.getBody());
            }

            // Retornamos SOLO el nombre para guardarlo en BD (ej. 36cf9...autonivelador.webp)
            return nombreUnico;

        } catch (IOException e) {
            throw new RuntimeException("Error al leer los bytes del archivo", e);
        }
    }

    private void mapearDtoAEntidad(ProductoDTO dto, Producto producto) {
        producto.setNombre(dto.getNombre());
        producto.setMarca(dto.getMarca());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());
        producto.setStock(dto.getStock());

        // Ahora asigna la URL final que le entregó el método de arriba
        producto.setImagenUrl(dto.getImagenUrl());
        producto.setEspecificaciones(dto.getEspecificaciones());

        if (dto.getActivo() != null) {
            producto.setActivo(dto.getActivo());
        } else if (producto.getId() == null) {
            producto.setActivo(true);
        }

        if (dto.getCategoriaId() != null) {
            Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                    .orElseThrow(() -> new RuntimeException("Error: La categoría seleccionada no existe."));
            producto.setImagenUrl(dto.getImagenUrl());
            producto.setCategoria(categoria);
        }
    }
}
