package hardware.store.pe.consumers;

import hardware.store.pe.config.RabbitMQConfig;
import hardware.store.pe.dtos.ItemCarritoDTO;
import hardware.store.pe.dtos.NuevaOrdenDTO;
import hardware.store.pe.models.Orden;
import hardware.store.pe.models.OrdenDetalle;
import hardware.store.pe.models.Producto;
import hardware.store.pe.models.Usuario;
import hardware.store.pe.repositories.OrdenRepository;
import hardware.store.pe.repositories.ProductoRepository;
import hardware.store.pe.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class OrdenConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrdenConsumer.class);

    private final OrdenRepository ordenRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    // Escucha automáticamente los mensajes que lleguen a la cola
    @RabbitListener(queues = RabbitMQConfig.QUEUE_ORDERS)
    @Transactional // Mantiene el control transaccional original
    public void procesarOrdenDeCola(NuevaOrdenDTO dto) {
        log.info("Recibiendo orden en cola para el usuario ID: {}", dto.getUsuarioId());

        try {
            Usuario cliente = usuarioRepository.findById(dto.getUsuarioId())
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            Orden nuevaOrden = new Orden();
            nuevaOrden.setUsuario(cliente);
            BigDecimal totalOrden = BigDecimal.ZERO;

            // Procesamos la lógica original de stock
            for (ItemCarritoDTO item : dto.getItems()) {
                Producto producto = productoRepository.findById(item.getProductoId())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

                if (producto.getStock() < item.getCantidad()) {
                    throw new RuntimeException("Stock insuficiente para: " + producto.getNombre());
                }

                producto.setStock(producto.getStock() - item.getCantidad());
                productoRepository.save(producto);

                OrdenDetalle detalle = new OrdenDetalle();
                detalle.setProducto(producto);
                detalle.setCantidad(item.getCantidad());
                detalle.setPrecioUnitario(producto.getPrecio());

                nuevaOrden.addDetalle(detalle);
                BigDecimal subtotal = producto.getPrecio().multiply(new BigDecimal(item.getCantidad()));
                totalOrden = totalOrden.add(subtotal);
            }

            nuevaOrden.setTotal(totalOrden);
            nuevaOrden.setEstado("PENDIENTE"); // Estado final exitoso
            ordenRepository.save(nuevaOrden);

            log.info("Orden procesada exitosamente con Total: S/{}", totalOrden);

        } catch (Exception e) {
            log.error("Fallo al procesar la orden en cola: {}", e.getMessage());
            // Aquí podrías agregar lógica para notificar al cliente del fallo (ej. por WebSocket o correo)
        }
    }
}