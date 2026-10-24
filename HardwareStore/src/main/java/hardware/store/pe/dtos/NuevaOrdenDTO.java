package hardware.store.pe.dtos;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class NuevaOrdenDTO {
    private Integer usuarioId;
    private List<ItemCarritoDTO> items;
    private String canal;
    private String metodoPago;
    private String tipoComprobante;
    private String nombreCliente;
    private String documentoCliente;
}
