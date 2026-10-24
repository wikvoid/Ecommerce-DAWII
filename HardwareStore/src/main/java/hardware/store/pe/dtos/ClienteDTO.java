package hardware.store.pe.dtos;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ClienteDTO {
    private Integer id;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private Integer totalPedidos;
    private BigDecimal totalGastado;
    private String ultimaCompra;
}
