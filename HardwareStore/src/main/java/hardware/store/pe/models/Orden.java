package hardware.store.pe.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordenes")
@Getter @Setter
@NoArgsConstructor
public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Quién hizo la compra
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "fecha_orden", updatable = false)
    @CreationTimestamp
    private LocalDateTime fechaOrden;

    @Column(length = 50)
    private String estado = "PENDIENTE";

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "canal")
    private String canal;

    @Column(name = "metodo_pago")
    private String metodoPago;

    @Column(name = "tipo_comprobante", length = 20)
    private String tipoComprobante; // "Boleta" o "Factura"

    @Column(name = "nombre_cliente")
    private String nombreCliente; // Nombre tipeado en el POS

    @Column(name = "documento_cliente", length = 20)
    private String documentoCliente; // DNI o RUC tipeado en el POS

    // Relación Bidireccional: Una orden tiene muchos detalles.
    // CascadeType.ALL significa que si guardas la Orden, los Detalles se guardan automáticamente.
    // orphanRemoval = true borra de la BD los detalles si los sacas de esta lista.
    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrdenDetalle> detalles = new ArrayList<>();

    // Método de utilidad para mantener sincronizadas las relaciones bidireccionales
    public void addDetalle(OrdenDetalle detalle) {
        detalles.add(detalle);
        detalle.setOrden(this);
    }
}
