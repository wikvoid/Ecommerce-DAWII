package hardware.store.pe.services;

import hardware.store.pe.dtos.ClienteDTO;
import hardware.store.pe.models.Orden;
import hardware.store.pe.models.RolNombre;
import hardware.store.pe.models.Usuario;
import hardware.store.pe.repositories.OrdenRepository;
import hardware.store.pe.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final OrdenRepository ordenRepository;

    public List<ClienteDTO> obtenerEstadisticasClientes() {
        // 1. Obtenemos todos los usuarios
        List<Usuario> todosLosUsuarios = usuarioRepository.findAll();
        List<ClienteDTO> clientesStats = new ArrayList<>();

        // Formateador para que la fecha salga como "23 oct. 2026" y Angular no tenga que hacer nada
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy", new Locale("es", "ES"));

        for (Usuario u : todosLosUsuarios) {
            // 2. Filtramos en memoria para procesar solo a los que tienen ROLE_CLIENTE
            boolean esCliente = u.getRoles().stream()
                    .anyMatch(rol -> rol.getNombre() == RolNombre.ROLE_CLIENTE);

            if (esCliente) {
                ClienteDTO dto = new ClienteDTO();
                dto.setId(u.getId());
                dto.setNombre(u.getNombre());
                dto.setApellido(u.getApellido());
                dto.setEmail(u.getEmail());
                dto.setTelefono(u.getTelefono());

                // 3. Buscamos el historial de este cliente específico (método que ya tienes en tu repo)
                List<Orden> historial = ordenRepository.findByUsuarioIdOrderByFechaOrdenDesc(u.getId());

                dto.setTotalPedidos(historial.size());

                // 4. Sumamos el total gastado (solo de órdenes que no estén canceladas)
                BigDecimal totalGastado = BigDecimal.ZERO;
                for (Orden o : historial) {
                    if (!"CANCELADO".equals(o.getEstado())) {
                        totalGastado = totalGastado.add(o.getTotal());
                    }
                }
                dto.setTotalGastado(totalGastado);

                // 5. Asignamos la fecha de la última compra (como la lista ya viene ordenada descendentemente, es la posición 0)
                if (!historial.isEmpty()) {
                    dto.setUltimaCompra(historial.getFirst().getFechaOrden().format(formatter));
                } else {
                    dto.setUltimaCompra("Sin compras");
                }

                clientesStats.add(dto);
            }
        }

        return clientesStats;
    }
}