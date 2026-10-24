package hardware.store.pe.controllers;

import hardware.store.pe.dtos.ClienteDTO;
import hardware.store.pe.repositories.UsuarioRepository;
import hardware.store.pe.services.UsuarioServiceImpl; // O UsuarioService si usas la interfaz
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioServiceImpl usuarioService;
    private final UsuarioRepository usuarioRepository;

    // Solo los administradores (o vendedores) pueden ver la lista general de clientes
    @PreAuthorize("hasRole('ADMIN') or hasRole('VENDEDOR')")
    @GetMapping("/clientes")
    public ResponseEntity<List<ClienteDTO>> listarClientes() {
        return new ResponseEntity<>(usuarioService.obtenerEstadisticasClientes(), HttpStatus.OK);
    }
    @GetMapping("/buscar-dni/{dni}")
    public ResponseEntity<?> buscarClientePorDni(@PathVariable String dni) {
        return usuarioRepository.findByDni(dni)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
