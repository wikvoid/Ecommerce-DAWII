package hardware.store.pe.controllers;

import hardware.store.pe.models.Categoria;
import hardware.store.pe.repositories.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Fundamental para que Angular pueda consumirlo sin bloqueos
public class CategoriaController {

    private final CategoriaRepository categoriaRepository;

    // 1. OBTENER TODAS (Ya lo tenías)
    @GetMapping
    public ResponseEntity<List<Categoria>> listarCategorias() {
        List<Categoria> categorias = categoriaRepository.findAll();
        return ResponseEntity.ok(categorias);
    }

    // 2. CREAR NUEVA CATEGORÍA
    @PreAuthorize("hasRole('ALMACEN') or hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Categoria> crearCategoria(@RequestBody Categoria categoria) {
        // Por defecto, una categoría nueva nace activa
        // Si tu modelo Categoria.java tiene el campo 'activo', descomenta la siguiente línea:
        // categoria.setActivo(true);

        Categoria nuevaCategoria = categoriaRepository.save(categoria);
        return new ResponseEntity<>(nuevaCategoria, HttpStatus.CREATED);
    }

    // 3. ACTUALIZAR CATEGORÍA EXISTENTE (Editar texto o Ícono)
    @PreAuthorize("hasRole('ALMACEN') or hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Categoria> actualizarCategoria(@PathVariable Integer id, @RequestBody Categoria detallesCategoria) {
        return categoriaRepository.findById(id)
                .map(categoriaExistente -> {
                    categoriaExistente.setNombre(detallesCategoria.getNombre());

                    // Si agregaste estos campos a tu entidad Categoria.java, descoméntalos:
                    // categoriaExistente.setCodigo(detallesCategoria.getCodigo());
                    // categoriaExistente.setDescripcion(detallesCategoria.getDescripcion());
                    // categoriaExistente.setIcono(detallesCategoria.getIcono());
                    // categoriaExistente.setActivo(detallesCategoria.getActivo());

                    Categoria categoriaActualizada = categoriaRepository.save(categoriaExistente);
                    return new ResponseEntity<>(categoriaActualizada, HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
}