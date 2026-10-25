package hardware.store.pe.services;

import hardware.store.pe.config.RabbitMQConfig;
import hardware.store.pe.dtos.ItemCarritoDTO;
import hardware.store.pe.dtos.NuevaOrdenDTO;
import hardware.store.pe.models.Orden;
import hardware.store.pe.models.OrdenDetalle;
import hardware.store.pe.models.Usuario;
import hardware.store.pe.repositories.OrdenRepository;
import hardware.store.pe.repositories.ProductoRepository;
import hardware.store.pe.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdenServiceImpl implements OrdenService {

    private final OrdenRepository ordenRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RabbitTemplate rabbitTemplate;

    @Override
    @Transactional // IMPORTANTE: Garantiza que la orden y los detalles se guarden juntos o fallen juntos
    public Orden crearOrden(NuevaOrdenDTO dto) {
        Usuario cliente = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Orden ordenEnProceso = new Orden();
        ordenEnProceso.setUsuario(cliente);
        ordenEnProceso.setEstado("EN_PROCESAMIENTO");
        ordenEnProceso.setTipoComprobante(dto.getTipoComprobante() != null ? dto.getTipoComprobante() : "Boleta");
        ordenEnProceso.setNombreCliente(dto.getNombreCliente());
        ordenEnProceso.setDocumentoCliente(dto.getDocumentoCliente());
        ordenEnProceso.setCanal(dto.getCanal() != null ? dto.getCanal() : "Web (Online)");
        ordenEnProceso.setMetodoPago(dto.getMetodoPago() != null ? dto.getMetodoPago() : "Pasarela Online");

        BigDecimal totalCalculado = BigDecimal.ZERO;

        // 1. Calculamos el total Y CREAMOS LOS DETALLES
        for (ItemCarritoDTO item : dto.getItems()) {
            var producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            BigDecimal cantidadItem = BigDecimal.valueOf(item.getCantidad());
            BigDecimal subtotalItem = producto.getPrecio().multiply(cantidadItem);
            totalCalculado = totalCalculado.add(subtotalItem);

            // CORRECCIÓN: Agregamos el detalle físico a la orden usando tu método de Orden.java
            OrdenDetalle detalle = new OrdenDetalle();
            detalle.setProducto(producto);
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            ordenEnProceso.addDetalle(detalle);
        }

        ordenEnProceso.setTotal(totalCalculado);

        // 2. GUARDADO SÍNCRONO: PostgreSQL crea el ID oficialmente
        ordenEnProceso = ordenRepository.save(ordenEnProceso);

        // 3. RABBITMQ REACTIVADO: Enviamos SOLO EL ID (Integer), ya no el DTO completo
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_ORDERS,
                RabbitMQConfig.ROUTING_KEY_ORDERS,
                ordenEnProceso.getId()
        );

        return ordenEnProceso;
    }

    @Override
    public List<Orden> listarHistorialCliente(Integer usuarioId) {
        return ordenRepository.findByUsuarioIdOrderByFechaOrdenDesc(usuarioId);
    }

    @Override
    public List<Orden> listarOrdenesPendientes() {
        return ordenRepository.findByEstadoOrderByFechaOrdenAsc("PENDIENTE");
    }

    @Override
    public Orden actualizarEstado(Integer ordenId, String nuevoEstado) {
        Orden orden = ordenRepository.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
        orden.setEstado(nuevoEstado);
        return ordenRepository.save(orden);
    }

    @Override
    public Orden buscarPorId(Integer id) {
        return ordenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada con ID: " + id));
    }

    @Override
    public List<Orden> listarTodasLasOrdenes() {
        // Trae absolutamente todas las órdenes de la base de datos
        return ordenRepository.findAll();
    }
}
