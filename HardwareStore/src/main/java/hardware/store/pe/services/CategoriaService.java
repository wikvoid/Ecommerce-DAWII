package hardware.store.pe.services;

import hardware.store.pe.models.Categoria;
import hardware.store.pe.repositories.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Transactional(readOnly = true)
    public List<Categoria> obtenerTodas() {
        return categoriaRepository.findAll();
    }

    @Transactional
    public Categoria crearCategoria(Categoria categoria) {
        // Blindaje: Garantiza que nazca activa si el JSON viene sin este campo
        if (categoria.getActivo() == null) {
            categoria.setActivo(true);
        }
        return categoriaRepository.save(categoria);
    }

    @Transactional
    public Optional<Categoria> actualizarCategoria(Integer id, Categoria detalles) {
        return categoriaRepository.findById(id).map(categoriaExistente -> {
            categoriaExistente.setNombre(detalles.getNombre());
            categoriaExistente.setCodigo(detalles.getCodigo());
            categoriaExistente.setDescripcion(detalles.getDescripcion());

            // Solo actualizamos el estado si el frontend lo envía explícitamente
            if (detalles.getActivo() != null) {
                categoriaExistente.setActivo(detalles.getActivo());
            }

            return categoriaRepository.save(categoriaExistente);
        });
    }
}