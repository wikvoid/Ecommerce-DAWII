package hardware.store.pe.services;

import hardware.store.pe.dtos.ProductoDTO;
import hardware.store.pe.models.Producto;
import org.springframework.web.multipart.MultipartFile; // <-- Añadido

import java.util.List;

public interface ProductoService {
    List<Producto> listarActivos();
    List<Producto> buscarPorCategoria(Integer categoriaId);
    List<Producto> buscarPorNombre(String termino);
    Producto buscarPorId(Integer id);

    // MODIFICADO: Ahora reciben el archivo físico
    Producto crear(ProductoDTO dto, MultipartFile file);
    Producto actualizar(Integer id, ProductoDTO dto, MultipartFile file);

    void eliminarLogico(Integer id);
}
