package hardware.store.pe.controllers;

import hardware.store.pe.dtos.ProductoDTO;
import hardware.store.pe.models.Producto;
import hardware.store.pe.services.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType; // <-- Añadido
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // <-- Añadido

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<Producto>> listarCatalogo() {
        return new ResponseEntity<>(productoService.listarActivos(), HttpStatus.OK);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Producto>> buscarProductos(@RequestParam String termino) {
        return new ResponseEntity<>(productoService.buscarPorNombre(termino), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerProductoPorId(@PathVariable Integer id) {
        Producto producto = productoService.buscarPorId(id);
        return new ResponseEntity<>(producto, HttpStatus.OK);
    }

    // MODIFICADO: Recibe 'producto' como JSON y 'file' como archivo binario
    @PreAuthorize("hasRole('ALMACEN') or hasRole('ADMIN')")
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Producto> crearProducto(
            @RequestPart("producto") ProductoDTO dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return new ResponseEntity<>(productoService.crear(dto, file), HttpStatus.CREATED);
    }

    // MODIFICADO: Recibe 'producto' como JSON y 'file' como archivo binario
    @PreAuthorize("hasRole('ALMACEN') or hasRole('ADMIN')")
    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Producto> actualizarProducto(
            @PathVariable Integer id,
            @RequestPart("producto") ProductoDTO dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return new ResponseEntity<>(productoService.actualizar(id, dto, file), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('ALMACEN') or hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Integer id) {
        productoService.eliminarLogico(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}