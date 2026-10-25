package hardware.store.pe.controllers;

import hardware.store.pe.dtos.NuevaOrdenDTO;
import hardware.store.pe.models.Orden;
import hardware.store.pe.services.OrdenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenController {

    private final OrdenService ordenService;
    private final SimpMessagingTemplate messagingTemplate;

    // CLIENTE / VENDEDOR: El botón de "Pagar" o "Cobrar" en Angular enviará el carrito aquí
    @PreAuthorize("hasRole('CLIENTE') or hasRole('VENDEDOR') or hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Orden> procesarCompra(@RequestBody NuevaOrdenDTO dto) {
        // CAMBIO: Pasamos el DTO completo
        Orden nuevaOrden = ordenService.crearOrden(dto);
        return new ResponseEntity<>(nuevaOrden, HttpStatus.CREATED);
    }

    // CLIENTE: Ver su historial personal de compras
    @PreAuthorize("hasRole('CLIENTE')")
    @GetMapping("/mis-pedidos/{usuarioId}")
    public ResponseEntity<List<Orden>> verMisPedidos(@PathVariable Integer usuarioId) {
        return new ResponseEntity<>(ordenService.listarHistorialCliente(usuarioId), HttpStatus.OK);
    }

    // VENDEDOR: Ver la cola de trabajo en la tienda física
    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    @GetMapping("/pendientes")
    public ResponseEntity<List<Orden>> verOrdenesPorDespachar() {
        return new ResponseEntity<>(ordenService.listarOrdenesPendientes(), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    @PutMapping("/{id}/estado")
    public ResponseEntity<Orden> cambiarEstadoPedido(@PathVariable Integer id, @RequestParam String estado) {
        // 1. Actualizamos en la base de datos a través de tu servicio
        Orden ordenActualizada = ordenService.actualizarEstado(id, estado);

        // 2. DISPARAMOS EL EVENTO EN TIEMPO REAL
        // Lo enviamos a un canal único para esta orden específica (ej. /topic/ordenes/105)
        messagingTemplate.convertAndSend("/topic/ordenes/" + id, ordenActualizada);

        return new ResponseEntity<>(ordenActualizada, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('CLIENTE') or hasRole('VENDEDOR') or hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<Orden> obtenerOrdenPorId(@PathVariable Integer id, Authentication authentication) {
        Orden orden = ordenService.buscarPorId(id);

        // 1. Verificamos si el usuario actual es un empleado (ellos sí pueden ver todas las órdenes)
        boolean isEmpleado = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_VENDEDOR") || role.getAuthority().equals("ROLE_ALMACEN"));

        // 2. Si es un CLIENTE normal, su identificador (email o username en el token) debe coincidir con el de la orden
        // Ajusta getEmail() por getUsername() si tu sistema de login usa nombres de usuario en lugar de correos
        if (!isEmpleado && !orden.getUsuario().getEmail().equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: No eres el titular de esta orden.");
        }

        return new ResponseEntity<>(orden, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    @GetMapping("/todas")
    public ResponseEntity<List<Orden>> listarTodasLasOrdenes() {
        return new ResponseEntity<>(ordenService.listarTodasLasOrdenes(), HttpStatus.OK);
    }
}
