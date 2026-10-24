package hardware.store.pe.services;

import hardware.store.pe.dtos.NuevaOrdenDTO; // Importa el DTO
import hardware.store.pe.models.Orden;
import java.util.List;

public interface OrdenService {
    // CAMBIO: Ahora recibe el DTO completo
    Orden crearOrden(NuevaOrdenDTO dto);

    List<Orden> listarHistorialCliente(Integer usuarioId);
    List<Orden> listarOrdenesPendientes();
    Orden actualizarEstado(Integer ordenId, String nuevoEstado);
    Orden buscarPorId(Integer id);
    List<Orden> listarTodasLasOrdenes();
}
