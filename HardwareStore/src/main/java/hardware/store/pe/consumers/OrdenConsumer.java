package hardware.store.pe.consumers;

import hardware.store.pe.config.RabbitMQConfig;
import hardware.store.pe.models.Orden;
import hardware.store.pe.models.OrdenDetalle;
import hardware.store.pe.models.Producto;
import hardware.store.pe.repositories.OrdenRepository;
import hardware.store.pe.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class OrdenConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrdenConsumer.class);

    private final OrdenRepository ordenRepository;
    private final ProductoRepository productoRepository;
    // Eliminamos usuarioRepository porque la orden ya viene con el usuario asociado desde el Service

    // Escucha automáticamente los mensajes que lleguen a la cola
    @RabbitListener(queues = RabbitMQConfig.QUEUE_ORDERS)
    @Transactional // Mantiene el control transaccional original
    public void procesarOrdenDeCola(Integer ordenId) { // CAMBIO CLAVE: Ahora recibe el ID (Integer)
        log.info("RabbitMQ: Procesando tareas en segundo plano para la Orden ID: {}", ordenId);

        try {
            // 1. BUSCAMOS LA ORDEN QUE EL SERVICE YA CREÓ
            Orden ordenExistente = ordenRepository.findById(ordenId)
                    .orElseThrow(() -> new RuntimeException("Orden no encontrada en BD"));

            // 2. DESCONTAMOS EL STOCK BASÁNDONOS EN LOS DETALLES FÍSICOS DE LA BD
            for (OrdenDetalle detalle : ordenExistente.getDetalles()) {
                Producto producto = detalle.getProducto();

                if (producto.getStock() < detalle.getCantidad()) {
                    throw new RuntimeException("Stock insuficiente para: " + producto.getNombre());
                }

                // Actualizamos el stock
                producto.setStock(producto.getStock() - detalle.getCantidad());
                productoRepository.save(producto);
            }

            // 3. ACTUALIZAMOS EL ESTADO PARA EL PANEL DEL VENDEDOR
            // Cambia de "EN_PROCESAMIENTO" (puesto por el Service) a "PENDIENTE" (listo para despachar)
            ordenExistente.setEstado("PENDIENTE");
            ordenRepository.save(ordenExistente);

            log.info("RabbitMQ: Orden {} procesada exitosamente. Stock actualizado.", ordenId);

        } catch (Exception e) {
            log.error("RabbitMQ: Fallo al procesar la orden {}: {}", ordenId, e.getMessage());

            // Opcional: Si el stock falla, podemos marcar la orden como rechazada
            // para que el cajero vea el error en la interfaz de Angular
            try {
                ordenRepository.findById(ordenId).ifPresent(orden -> {
                    orden.setEstado("RECHAZADA_POR_STOCK");
                    ordenRepository.save(orden);
                });
            } catch (Exception ex) {
                log.error("No se pudo actualizar el estado a RECHAZADA: {}", ex.getMessage());
            }
        }
    }
}