package hardware.store.pe.dtos;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter @Setter
public class ProductoDTO {
    private String nombre;
    private String marca;
    private String descripcion;
    private BigDecimal precio;
    private Integer stock;
    private String imagenUrl;

    // Solo recibimos el ID desde el select de Angular
    private Integer categoriaId;

    // Recibirá el arreglo convertido en String desde Angular
    private String especificaciones;

    private Boolean activo;
}
